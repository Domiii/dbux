import { newLogger } from '@dbux/common/src/log/logger';
import BackendAuth from './BackendAuth2';
import { Db } from './db';
import { initContainers } from './containers/index';
import FirestoreContainer from './FirestoreContainer';

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

  /**
   * @param {ProjectsManager} practiceManager 
   */
  constructor(practiceManager) {
    this.practiceManager = practiceManager;

    this._initialized = false;

    this.db = new Db(this);
    this.auth = new BackendAuth(this);

    // createContainers(this.db);
  }

  async installBackendDependencies() {
    // NOTE: we are copying and shipping firebase via `resources/dist/node_modules
    // await this.practiceManager.installModules(this.deps);
  }

  async init() {
    if (this._initialized) {
      return;
    }
    await this.installBackendDependencies();
    await this.db.init();

    // register containers
    let containers = await initContainers(this.db);
    for (let container of containers) {
      this.registerContainer(container);
    }

    this._initialized = true;
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

  /**
   * NOTE: In order to use most of the backend functionality, we first need to login.
   */
  async login() {
    await this.init();

    await this.auth.login();
  }
}
