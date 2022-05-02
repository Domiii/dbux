
import { newLogger } from '@dbux/common/src/log/logger';
import NestedError from '@dbux/common/src/NestedError';
import { uploadPathways } from '@dbux/projects/src/firestore/upload';
import SafetyStorage from './SafetyStorage';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('PathwaysDataBuffer');

// const Verbose = true;
const Verbose = false;

const DefaultBufferSize = 10;
const DefaultBufferFlushTime = 2 * 60 * 1000; // 2 minutes
// const DefaultBufferFlushTime = 1 * 1000; // 1 second

/**
 * @template T
 */
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

  /**
   * @param {T[]} entries 
   */
  async add(entries) {
    await this.buffer.acquireLock();

    try {
      const buffer = this.safeGetBuffer();
      buffer.push(...entries);
      await this.buffer.set(buffer);
    }
    finally {
      this.buffer.releaseLock();
    }
  }

  async maybeFlush() {
    if (!this._flushing && (this.safeGetBuffer().length >= DefaultBufferSize || Date.now() - this._previousFlushTime >= DefaultBufferFlushTime)) {
      await this.flush();
    }
  }

  async flush() {
    Verbose && log(`Flushing collection ${this.collectionName}`);
    this._flushing = true;

    try {
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
        throw new NestedError(`Failed when flushing`, err);
      }

      this._previousFlushTime = Date.now();
    }
    finally {
      this._flushing = false;
    }
  }

  async addDoc(entries) {
    if (entries.length) {
      Verbose && log(`Uploading ${entries.length} "${this.collectionName}" of session "${this.sessionId}"`);
      return await uploadPathways(this.sessionId, this.collectionName, entries);
    }
    else {
      return null;
    }
  }
}