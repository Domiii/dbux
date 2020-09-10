
import { newLogger } from '@dbux/common/src/log/logger';
import FirestoreContainer from './FirestoreContainer';
import SafetyStorage from './SafetyStorage';

/** @typedef {import('../db').Db} Db */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('BufferedFirestoreContainer');

// const Verbose = true;
const Verbose = false;

const DefaultBufferSize = 3;
const DefaultBufferFlushTime = 5 * 60 * 1000; // 5 minutes

class BufferedFirestoreContainer extends FirestoreContainer {
  constructor(db, collectionName) {
    super(db, collectionName);

    this.buffer = new SafetyStorage(this._keyName);
    this._previousFlushTime = new Date();

    Verbose && debug(`restore buffer @${this.collectionName}`, this.buffer.get());
  }

  /**
   * @return {Array}
   */
  safeGetBuffer() {
    return this.buffer.get() || [];
  }

  async addDocs(data) {
    return this.addDoc({ entries: data });
    // NOTE: The maximum document size in Firestore is 1MiB (see: https://firebase.google.com/docs/firestore/quotas)
  }

  hasUnflushedEvent() {
    return !!this.safeGetBuffer().length;
  }

  async add(event) {
    await this.buffer.acquireLock();

    try {
      let buffer = this.safeGetBuffer();
      buffer.push(event);
      await this.buffer.set(buffer);
    }
    finally {
      this.buffer.releaseLock();
    }
  }

  async flush() {
    if (!this._flushing && (this.safeGetBuffer().length >= DefaultBufferSize || (new Date()) - this._previousFlushTime >= DefaultBufferFlushTime)) {
      this._flushing = true;
      await this._flush();
      this._flushing = false;
    }
  }

  async _flush() {
    if (!this.db.backendController._initialized) {
      return;
    }

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
      await this.addDocs(buffer);
    } 
    catch (err) {
      throw new Error(`Failed when flushing: ${err.message}`);
    }

    this._previousFlushTime = new Date();
  }
}

export default BufferedFirestoreContainer;