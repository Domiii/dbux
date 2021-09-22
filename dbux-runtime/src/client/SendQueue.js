/** @typedef { import("./Client").default } Client */

import isEmpty from 'lodash/isEmpty';
import sumBy from 'lodash/sumBy';
import { getDataCount } from '@dbux/common/src/util/dataUtil';
import { newLogger } from '@dbux/common/src/log/logger';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Client/queue');

const Verbose = 0;
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

function newBuffer() {
  return {};
}

function isBufferEmpty(buf) {
  return isEmpty(buf);
}

class SendQueue {
  /**
   * @type {Client}
   */
  client;
  buffers = [newBuffer()];
  timer;

  constructor(client) {
    this.client = client;
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

  send(dataName, newEntry) {
    const buf = this.currentBuffer;
    const entries = (buf[dataName] = buf[dataName] || []);
    entries.push(newEntry);

    this._flushLater();
  }

  sendAll(dataName, newEntries) {
    const buf = this.currentBuffer;
    const entries = (buf[dataName] = buf[dataName] || []);
    appendArrayInPlace(entries, newEntries);

    this._flushLater();
  }

  _flushLater() {
    if (!this.timer) {
      // this.timer = Promise.resolve().then(this.flush);
      this.timer = (process.nextTick(this.flush), 1);
      Verbose && debug(`[SQ] flushLater!`);
    }
  }

  _nextBuffer() {
    if (!isBufferEmpty(this.currentBuffer)) {
      // add new empty buffer to store new incoming data
      
      // const sum = sumBy(Object.values(this.currentBuffer),
      //   arr => arr.reduce((a, v) => a + JSON.stringify(v).length, 0) || 0);
      // this.currentBuffer?.values?.reduce((a, v) => a + JSON.stringify(v.serialized).length, 0);
      // debug(`previous buffer total length: ${Math.round(sum / 1000).toLocaleString('en-us')}k`);
      this.buffers.push(newBuffer());
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

  /**
   * Send all buffered data in a loop
   */
  flush = async () => {
    this._nextBuffer();

    Verbose && debug(`[SQ] flush STA`, this.buffers.length);

    // start sending old buffers
    try {
      let buf;
      while (
        this.buffers.length &&
        // eslint-disable-next-line prefer-destructuring
        (buf = this.buffers[0]) &&
        (isBufferEmpty(buf) || await this.client.sendOne(buf))) {
        // remove buffer after send
        this.buffers.splice(0, 1);

        if (!isBufferEmpty(buf)) {
          Verbose && debug(`[SQ] flush BUF`, this.buffers.length, getDataCount(buf));
        }
      }

      if (this.isEmpty) {
        // everything was sent out
        this.buffers.push(newBuffer());
        this.client._onSendFinish();
      }
    }
    finally {
      // console.warn(`[SQ]`, this.buffers.length, !!this.buffers[0], isBufferEmpty(this.buffers[0]));
      Verbose && debug(`[SQ] flush END`, this.buffers.length);
      this.timer = null;
    }
  }
}

export default SendQueue;