import { newLogger } from '@dbux/common/src/log/logger';
import BackendAuth from './BackendAuth2';
import { Db } from './db';
import { initLoginContainers, initNormalContainers } from './containers/index';
import FirestoreContainer from './FirestoreContainer';
import { initSafetyStorage } from './SafetyStorage';

/** @typedef {import('../ProjectsManager').default} ProjectsManager */

const { log, debug, warn, error: logError } = newLogger('Backend');

export default class BackndController {
  // deps = [
  //   // NOTE: firebase for node cannot be bundled properly, so we need to install it after the fact
  //   'firebase@7.17.1'
  // ];

  /**
   * @type {{[string]: FirestoreContainer}}
   */
  containers = {};

  loginPromise;
  initPromise;

  /**
   * @param {ProjectsManager} practiceManager 
   */
  constructor(practiceManager) {
    this.practiceManager = practiceManager;

    initSafetyStorage(practiceManager.externals.storage);

    this._initialized = false;

    this.db = new Db(this);
    this.auth = new BackendAuth(this);

    // createContainers(this.db);
  }

  async installBackendDependencies() {
    // NOTE: we are copying and shipping firebase via `resources/dist/node_modules
    // await this.practiceManager.installModules(this.deps);
  }

  async _init() {
    await this.installBackendDependencies();
    await this.db.init();

    // register containers
    let containers = await initNormalContainers(this.db);
    for (let container of containers) {
      this.registerContainer(container);
    }

    await this.db._replay();

    this._initialized = true;
  }

  async init() {
    if (this.initPromise) {
      return this.initPromise;
    }

    return this.initPromise = this._init();
  }

  async getOrInitDb() {
    await this.init();
    return this.db;
  }


  // ###########################################################################
  // containers
  // ###########################################################################

  registerContainer(container) {
    this.containers[container.name] = container;
  }

  // ###########################################################################
  // login
  // ###########################################################################

  async _login() {
    await this.init();

    await this.auth.login();

    let containers = await initLoginContainers(this.db);
    for (let container of containers) {
      this.registerContainer(container);
    }
  }

  /**
   * NOTE: In order to use most of the backend functionality, we first need to login.
   */
  async login() {
    if (this.loginPromise) {
      return this.loginPromise;
    }

    return this.loginPromise = this._login();
  }
}
