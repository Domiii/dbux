import { newLogger } from '@dbux/common/src/log/logger';
import { onUserEvent } from '../../userEvents';
import FirestoreContainer from '../FirestoreContainer';

/** @typedef {import('../db').Db} Db */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('UserEventContainer');

const Verbose = true;

export default class UserEventContainer extends FirestoreContainer {
  buffer = [];

  /**
   * @param {Db} db 
   */
  constructor(db) {
    super(db, 'userEvents');

    this.buffer = this.db.backendController.practiceManager.externals.storage.get(this._mementoKeyName) || [];
    this._previousFlushTime = new Date();

    Verbose && debug(`restore buffer @${this.collectionName}`, this.buffer);
  }

  async init() {
    super.init();

    this.db.backendController.practiceManager.externals.onUserEvent(this.addEvent);
    onUserEvent(this.addEvent);

    await this.flush();

    // TODO: start listen on dbux-code/src/userEvents
    // TODO: start listen on dbux-projects/src/userEvents
    // TODO: write an event handler for when an event occurs:
    //    - Store the buffer array to DB (1) if it contains at least 100 events or (2) 5 minutes after receiving the first event. Make sure, that buffer never gets lost (use Memento etc.)
    //      - return this.addDoc(data);

    // NOTE: The maximum document size in Firestore is 1MiB (see: https://firebase.google.com/docs/firestore/quotas)
  }

  hasUnflushedEvent() {
    return !!this.buffer.length;
  }

  async flush() {
    if (!this._flushing && (this.buffer.length >= 3 || (new Date()) - this._previousFlushTime >= 5 * 60 * 1000)) {
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

  addEvent = (name, data) => {
    const event = {
      name, 
      data,
      createdAt: new Date(),
    };
    this.buffer.push(event);

    Verbose && debug('receive new event', event);

    (async () => {
      try {
        await this.saveBuffer();
        await this.flush();
      } 
      catch (err) {
        logError(err);
      }
    })();
  }

  async saveBuffer() {
    return this.db.backendController.practiceManager.externals.storage.set(this._mementoKeyName, this.buffer);
  }
}