import merge from 'lodash/merge';
import { newLogger } from '@dbux/common/src/log/logger';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import SafetyStorage from './SafetyStorage';

/**
 * @typedef {import('../ProjectsManager').default} PracticeManager
 */

const { log, debug, warn, error: logError } = newLogger('Backlog');

// const Verbose = true;
const Verbose = false;

const keyName = 'dbux.projects.backend.backlog';

function isSameEntry(e1, e2) {
  return e1.containerName === e2.containerName && e1.id === e2.id;
}

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

    try {
      let backlog = this.safeGet();
      let editTarget;
      for (let entry of backlog) {
        if (isSameEntry(entry, writeRequest)) {
          editTarget = entry;
        }
      }

      if (!editTarget) {
        backlog.push(writeRequest);
      }
      else {
        merge(editTarget.data, writeRequest.data);
      }

      await this.set(backlog);
    } 
    finally {
      this.releaseLock();
    }


    Verbose && debug('contents after add', writeRequest, this.get());
  }

  /**
   * If backlog is corrupted, allow user to reset everything.
   */
  async resetBacklog() {
    await this.acquireLock();

    try {
      await this.set([]);
    }
    finally {
      this.releaseLock();
    }


    Verbose && debug('reset all contents');
  }

  // async _doWrite(writeRequest) {
  //   
  // }

  async replay() {
    await this.acquireLock();

    try {
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
    }
    finally {
      this.releaseLock();
    }
  }

  /**
   * Remove requests have same `containerName` and `id` with `request` from backlog. 
   * Pending request may not resolve in requested order, so we need to find it in backlog and delete it.
   * @param {object} request 
   */
  async tryRemoveEntry(request) {
    Verbose && debug('before try remove entry', request, this.safeGet());

    await this.acquireLock();

    try {
      let backlog = this.safeGet().filter((entry) => {
        return isSameEntry(entry, request);
      });
      await this.set(backlog);
    }
    finally {
      this.releaseLock();
    }

    Verbose && debug('after try remove entry', this.get());
  }
}