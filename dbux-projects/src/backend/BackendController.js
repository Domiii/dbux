import { newLogger } from '@dbux/common/src/log/logger';
import BackendAuth from './BackendAuth2';
import { initDB } from './db';

/** @typedef {import('../ProjectsManager').default} ProjectsManager */

const { log, debug, warn, error: logError } = newLogger('Backend');

export default class BackendController {
  deps = [
    // NOTE: firebase for node cannot be bundled properly, so we need to install it after the fact
    'firebase@7.17.1'
  ];

  /**
   * @param {ProjectsManager} practiceManager 
   */
  constructor(practiceManager) {
    this.practiceManager = practiceManager;
  }

  async installBackendDependencies() {
    await this.practiceManager.installModules(this.deps);
  }

  async init() {
    await this.installBackendDependencies();

    let { _db, firebase } = initDB(this.practiceManager);
    this.fs = _db;
    this.firebase = firebase;

    this.auth = new BackendAuth(this);
  }
}
