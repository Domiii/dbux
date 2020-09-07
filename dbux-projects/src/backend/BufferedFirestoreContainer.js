
import { newLogger } from '@dbux/common/src/log/logger';
import FirestoreContainer from './FirestoreContainer';

/** @typedef {import('../db').Db} Db */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('BufferedFirestoreContainer');

const Verbose = true;
const DefaultBufferSize = 3;
const DefaultBufferFlushTime = 5 * 60 * 1000; // 5 minutes

class BufferedFirestoreContainer extends FirestoreContainer {
  constructor(db, collectionName) {
    super(db, collectionName);

    this.buffer = this.db.backendController.practiceManager.externals.storage.get(this._mementoKeyName) || [];
    this._previousFlushTime = new Date();

    Verbose && debug(`restore buffer @${this.collectionName}`, this.buffer);
  }

  async addDocs(data) {
    return this.addDoc({ entries: data });
    // NOTE: The maximum document size in Firestore is 1MiB (see: https://firebase.google.com/docs/firestore/quotas)
  }

  hasUnflushedEvent() {
    return !!this.buffer.length;
  }

  async flush() {
    if (!this._flushing && (this.buffer.length >= DefaultBufferSize || (new Date()) - this._previousFlushTime >= DefaultBufferFlushTime)) {
      this._flushing = true;
      await this._flush();
      this._flushing = false;
    }
  }

  async _flush() {
    if (!this.db.backendController._initialized) {
      return;
    }

    try {
      await this.addDocs(this.buffer);
      this.buffer = [];
      await this.saveBuffer();
    } 
    catch (err) {
      throw new Error(`Failed when flushing: ${err.message}`);
    }

    this._previousFlushTime = new Date();
  }

  async saveBuffer() {
    return this.db.backendController.practiceManager.externals.storage.set(this._mementoKeyName, this.buffer);
  }
}

export default BufferedFirestoreContainer;