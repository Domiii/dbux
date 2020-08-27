import { newLogger } from '@dbux/common/src/log/logger';
import { onUserEvent } from '../../userEvents';
import FirestoreContainer from '../FirestoreContainer';

/** @typedef {import('../db').Db} Db */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('UserEventContainer');

export default class UserEventContainer extends FirestoreContainer {
  buffer = [];

  /**
   * @param {Db} db 
   */
  constructor(db) {
    super(db, 'userEvents');

    this._previousFlush = new Date(0);
  }

  hasUnflushedEvent() {
    return !!this.buffer.length;
  }

  async flush() {
    if (!this._flushing && (this.buffer.length >= 3 || (new Date()) - this._previousFlush >= 5 * 60 * 1000)) {
      // Race condition?
      this._flushing = true;
      await this._flush();
      this._flushing = false;
    }
  }

  async _flush() {
    while (this.hasUnflushedEvent()) {
      try {
        let firstEvent = this.buffer[0];
        await this.addDoc(firstEvent);
        this.buffer.shift();
        await this.saveBuffer();
      } 
      catch (err) {
        throw new Error(`Unnaturally stop flushing buffer by error: ${err.message}`);
      }
    }

    this._previousFlush = new Date();
  }

  addEvent = (name, data) => {
    const event = {
      name, 
      data,
      createAt: new Date(),
    };
    this.buffer.push(event);

    debug(event);

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

  async init() {
    this.buffer = this.db.practiceManager.externals.storage.get(this._mementoKeyName) || [];
    this.flush();

    this.db.practiceManager.externals.onUserEvent(this.addEvent);
    onUserEvent(this.addEvent);

    debug('inited, buffer: ', this.buffer);

    // TODO: start listen on dbux-code/src/userEvents
    // TODO: start listen on dbux-projects/src/userEvents
    // TODO: write an event handler for when an event occurs:
    //    - Store the buffer array to DB (1) if it contains at least 100 events or (2) 5 minutes after receiving the first event. Make sure, that buffer never gets lost (use Memento etc.)
    //      - return this.addDoc(data);

    // NOTE: The maximum document size in Firestore is 1MiB (see: https://firebase.google.com/docs/firestore/quotas)
  }

  async saveBuffer() {
    return this.db.practiceManager.externals.storage.set(this._mementoKeyName, this.buffer);
  }
}