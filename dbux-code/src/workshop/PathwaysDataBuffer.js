
import { newLogger } from '@dbux/common/src/log/logger';
import NestedError from '@dbux/common/src/NestedError';
import { uploadPathways } from '@dbux/projects/src/firestore/upload';
import SafetyStorage from './SafetyStorage';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('PathwaysDataBuffer');

const DefaultBufferSize = 50;
const DefaultBufferFlushTime = 2 * 60 * 1000; // 2 minutes

export default class PathwaysDataBuffer {
  constructor(sessionId, collectionName) {
    const storageKeyName = `dbux.pathwaysDataBuffer.${collectionName}`;
    this.buffer = new SafetyStorage(storageKeyName);
    this.sessionId = sessionId;
    this.collectionName = collectionName;
    this._previousFlushTime = Date.now();
  }

  /**
   * @return {Array}
   */
  safeGetBuffer() {
    return this.buffer.get() || [];
  }

  async add(entries) {
    await this.buffer.acquireLock();

    try {
      let buffer = this.safeGetBuffer();
      buffer.push(...entries);
      await this.buffer.set(buffer);
    }
    finally {
      this.buffer.releaseLock();
    }
  }

  async maybeFlush() {
    if (!this._flushing && (this.safeGetBuffer().length >= DefaultBufferSize || Date.now() - this._previousFlushTime >= DefaultBufferFlushTime)) {
      await this.forceFlush();
    }
  }

  async forceFlush() {
    this._flushing = true;
    await this._flush();
  }

  async _flush() {
    this._flushing = true;
    await this.buffer.acquireLock();

    let buffer;
    try {
      buffer = this.safeGetBuffer();
      await this.buffer.set([]);
    }
    finally {
      this.buffer.releaseLock();
    }

    try {
      await this.addDoc(buffer);
    }
    catch (err) {
      this._flushing = false;
      throw new NestedError(`Failed when flushing`, err);
    }

    this._previousFlushTime = Date.now();
  }

  async addDoc(entries) {
    return await uploadPathways(this.sessionId, this.collectionName, entries);
  }
}