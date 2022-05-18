import { newLogger } from '@dbux/common/src/log/logger';
import { onUserAction } from '../../userActions';
import BufferedFirestoreContainer from '../BufferedFirestoreContainer';

/** @typedef {import('../db').Db} Db */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('UserEventContainer');

// const Verbose = true;
const Verbose = false;

export default class UserEventContainer extends BufferedFirestoreContainer {
  /**
   * @param {Db} db 
   */
  constructor(db) {
    super(db, 'userActions');
  }

  async init() {
    super.init();

    onUserAction(this.addEvent);

    await this.flush();
  }

  addEvent = ({ type, data, createdAt }) => {
    const event = {
      type,
      data,
      createdAt
    };

    debug('Get event', type, data, createdAt);

    (async () => {
      try {
        await this.add(event);
        await this.flush();
      }
      catch (err) {
        logError(err);
      }
    })();
  }
}