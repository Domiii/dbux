import { newLogger } from '@dbux/common/src/log/logger';
import isEqual from 'lodash/isEqual';
import SafetyStorage from './SafetyStorage';

/**
 * @typedef {import('../ProjectsManager').default} PracticeManager
 */

const { log, debug, warn, error: logError } = newLogger('Backlog');

// const Verbose = true;
const Verbose = false;

const keyName = 'dbux.projects.backend.backlog';

export default class Backlog extends SafetyStorage {
  /**
   * @param {PracticeManager} practiceManager 
   * @param {Function} doWriteFunction
   */
  constructor(practiceManager, doWriteFunction) {
    super(keyName);

    this.practiceManager = practiceManager;
    this._doWrite = doWriteFunction;

    Verbose && debug('Backlog init: ', this.get());
  }

  safeGet() {
    return this.get() || [];
  }

  size() {
    return !!this.safeGet().length;
  }

  /**
   * Remember write action and try again later.
   * @param {object} writeRequest
   */
  async add(writeRequest) {
    await this.acquireLock();

    let backlog = this.safeGet();
    backlog.push(writeRequest);
    await this.set(backlog);

    this.releaseLock();

    Verbose && debug('contents after add', writeRequest, this.get());
  }

  /**
   * If backlog is corrupted, allow user to reset everything.
   */
  async resetBacklog() {
    await this.acquireLock();
    await this.set([]);
    this.releaseLock();

    Verbose && debug('reset all contents');
  }

  // async _doWrite(writeRequest) {
  //   
  // }

  async replay() {
    await this.acquireLock();
    let backlog = this.safeGet();
    Verbose && debug('replay');

    for (let writeRequest of backlog) {
      Verbose && debug('replay request', writeRequest);

      try {
        await this._doWrite(writeRequest);
        backlog.shift();
      }
      catch (err) {
        backlog.shift();
        warn(`Removed write request after error: ${err.message}\n\n${JSON.stringify(writeRequest)}`);
      }
    }

    await this.set([]);
    this.releaseLock();
  }

  /**
   * Remove `request` from backlog. Use `lodash.isEqual` to check whether the two item is equal. Only remove once if there is more than one.
   * Pending request may not resolve in requested order, so we need to find it in backlog and delete it.
   * @param {object} request 
   */
  async tryRemoveEntry(request) {
    Verbose && debug('before try remove entry', request, this.safeGet());

    await this.acquireLock();

    let deleted = false;
    let backlog = this.safeGet().filter((entry) => {
      let deleteThis = isEqual(request, entry) && !deleted;
      deleted |= deleteThis;
      return !deleteThis;
    });
    await this.set(backlog);
    this.releaseLock();

    Verbose && debug('after try remove entry', this.get());
  }
}