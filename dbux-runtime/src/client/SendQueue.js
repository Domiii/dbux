/** @typedef { import("./Client").default } Client */

import isEmpty from 'lodash/isEmpty';
import minBy from 'lodash/minBy';
import maxBy from 'lodash/maxBy';
import { getDataCount } from '@dbux/common/src/util/dataUtil';
import { newLogger } from '@dbux/common/src/log/logger';
import sleep from '@dbux/common/src/util/sleep';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Client/queue');

const Verbose = 0;
const DEBUG_ROOTS = false;
// const Verbose = 1;
const MAX_BLOCK_SIZE = 65535; // max parameter array size for use in Webkit

/**
 * @see https://dev.to/zenmumbler/comment/agae
 */
export function appendArrayInPlace(dest, source) {
  let offset = 0;
  let itemsLeft = source.length;

  if (itemsLeft <= MAX_BLOCK_SIZE) {
    dest.push.apply(dest, source);
  }
  else {
    while (itemsLeft > 0) {
      const pushCount = Math.min(MAX_BLOCK_SIZE, itemsLeft);
      const subSource = source.slice(offset, offset + pushCount);
      dest.push.apply(dest, subSource);
      itemsLeft -= pushCount;
      offset += pushCount;
    }
  }
  return dest;
}

function isBufferEmpty(buf) {
  return isEmpty(buf);
}

class SendQueue {
  /**
   * @type {Client}
   */
  client;
  buffers = [];
  timer;

  bufferMap = new Map();
  iBufferCreated = 0;
  iBufferSent = 0;

  constructor(client) {
    this.client = client;
    this.newBuffer();
  }

  newBuffer() {
    const buf = {};
    ++this.iBufferCreated;
    this.bufferMap.set(buf, this.iBufferCreated);
    return this.buffers.push(buf);
  }

  get firstBuffer() {
    return this.buffers[0];
  }

  get currentBuffer() {
    return this.buffers[this.buffers.length - 1];
  }

  get isEmpty() {
    return this.buffers.every(buf => isBufferEmpty(buf));
  }

  _debugMessages;
  _debugLastId;

  bufferDebug(msg, flush = true) {
    if (DEBUG_ROOTS) {
      // const bufferStr = JSON.stringify(Array.from(this.bufferMap.entries()), null, 2);
      const bufferStr = '';
      msg =
        `${msg}: ${this.iBufferSent}/${this.iBufferCreated} - ` +
        `${bufferStr}`;

      this._debugMessages = this._debugMessages || [];
      this._debugMessages.push(msg);

      if (flush) {
        // flush now
        this._debugMessages.forEach(m => debug(m));
        this._debugMessages = [];
      }
    }
  }

  send(dataName, newEntry) {
    const buf = this.currentBuffer;
    const entries = (buf[dataName] = buf[dataName] || []);
    entries.push(newEntry);

    if (DEBUG_ROOTS) {
      if (dataName === 'executionContexts') {
        if (!newEntry.parentContextId) {
          this.bufferDebug(`send root ${newEntry.contextId}`, false);
        }
      }
    }

    this._flushLater();
  }

  sendAll(dataName, newEntries) {
    const buf = this.currentBuffer;
    const entries = (buf[dataName] = buf[dataName] || []);
    appendArrayInPlace(entries, newEntries);

    this._flushLater();
  }

  _flushLater() {
    // TODO: this causes infinite loop, suggesting that some monkey patcher is too aggressive...
    // this.bufferDebug(`buffers updated`);
    if (!this.timer) {
      this.timer = Promise.resolve().then(this.flush);
      // this.timer = (process.nextTick(this.flush), 1);
      // this.timer = setTimeout(this.flush);
      Verbose && debug(`[SQ] flushLater!`);
    }
  }

  _nextBuffer() {
    if (!this.currentBuffer || !isBufferEmpty(this.currentBuffer)) {
      // add new empty buffer to store new incoming data

      // const sum = sumBy(Object.values(this.currentBuffer),
      //   arr => arr.reduce((a, v) => a + JSON.stringify(v).length, 0) || 0);
      // this.currentBuffer?.values?.reduce((a, v) => a + JSON.stringify(v.serialized).length, 0);
      // debug(`previous buffer total length: ${Math.round(sum / 1000).toLocaleString('en-us')}k`);
      this.newBuffer();
    }
  }

  /**
   * Called to indicate that the current buffer can be sent
   *    -> use this to create new buffer, and store future data separately.
   */
  bufferBreakpoint() {
    this._nextBuffer();
    // this._flushLater();
  }

  _flushCount = 0;

  /**
   * Send all buffered data in a loop
   */
  flush = async () => {
    if (this._flushCount) {
      throw new Error(`[Dbux] SendQueue.flush ignored: tried to flush more than once.`);
    }
    ++this._flushCount;
    // this._nextBuffer();

    // start sending old buffers
    Verbose && debug(`[SQ] flush STA ${this._flushCount},`, this.buffers.length);

    let buf;
    const b = this.buffers;
    try {
      while (
        (b.length > 1 || (b.length === 1 && !isBufferEmpty(b[0]))) &&
        // eslint-disable-next-line prefer-destructuring
        (buf = b[0])) {
        // remove buffer
        this.bufferMap.delete(buf);
        b.splice(0, 1);
        this._nextBuffer();

        let ma;
        if (DEBUG_ROOTS) {
          const contexts = buf.executionContexts;
          if (contexts) {
            ma = maxBy(contexts, c => c.contextId).contextId;
          }
        }

        if (!isBufferEmpty(buf)) {
          // send
          if (!await this.client.sendOne(buf)) {
            // send failed
            return;
          }
          ++this.iBufferSent;

          // await sleep(300); // amplify potential race condition

          if (DEBUG_ROOTS) {
            const contexts = buf.executionContexts;
            if (contexts) {
              const mi = minBy(contexts, c => c.contextId).contextId;
              const ma2 = maxBy(contexts, c => c.contextId).contextId;
              this.bufferDebug(`buffer sent, min=${mi}, max=${ma}`);
              const nMissing = ma2 - ma;
              if (nMissing) {
                logError(`[DEBUG_ROOTS] ${nMissing} context(s) missing: ${ma + 1} - ${ma2 - 1}`);
              }
              this._debugLastId = ma;
            }
          }
          buf = null;
          Verbose && debug(`[SQ] flush BUF`, this.buffers.length, getDataCount(buf));
        }
      }

      if (this.isEmpty) {
        // everything was sent out
        this.newBuffer();
        this.client._onSendFinish();
      }
    }
    finally {
      // console.warn(`[SQ]`, this.buffers.length, !!this.buffers[0], isBufferEmpty(this.buffers[0]));
      if (buf) {
        // buffer was dequeued but not sent: send back to queue
        this.buffers.unshift(buf);
      }
      Verbose && debug(`[SQ] flush END`, this.buffers.length);
      this.timer = null;
      --this._flushCount;
    }
  }
}

export default SendQueue;