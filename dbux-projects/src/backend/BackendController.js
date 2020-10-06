import isObject from 'lodash/isObject';
import { newLogger } from '@dbux/common/src/log/logger';
import BackendAuth from './BackendAuth2';
import { Db } from './db';
import { initLoginContainers, initNormalContainers } from './containers/index';
import FirestoreContainer from './FirestoreContainer';
import { initSafetyStorage } from './SafetyStorage';

/** @typedef {import('../ProjectsManager').default} ProjectsManager */

const { log, debug, warn, error: logError } = newLogger('Backend');

const performanceCounterKeyName = 'dbux-projects.backend.performanceCounter';
const defaultPerformanceCounterObject = {
  nReads: 0,
  nWrites: 0,
};
const performanceCounterPerTimeSegmentLimit = 300;

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
    await this.initPerformanceCounter();
    await this.db.init();

    // register containers
    let containers = await initNormalContainers(this.db);
    await this.registerContainers(containers);

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

  async registerContainer(container) {
    this.containers[container.name] = container;
    
    await this.initContainerPerformanceCounter(container);
  }

  async registerContainers(containers) {
    for (let container of containers) {
      await this.registerContainer(container);
    }
  }

  // ###########################################################################
  // login
  // ###########################################################################

  async _login() {
    await this.init();

    await this.auth.login();

    let containers = await initLoginContainers(this.db);
    await this.registerContainers(containers);
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

  // ###########################################################################
  // performance counter
  // ###########################################################################
  async initPerformanceCounter() {
    let { get, set } = this.practiceManager.externals.storage;

    if (!isObject(get(performanceCounterKeyName))) {
      await set(performanceCounterKeyName, {});
    }
  }

  async initContainerPerformanceCounter(container) {
    let { get, set } = this.practiceManager.externals.storage;

    let performanceCounter = get(performanceCounterKeyName);
    if (!isObject(performanceCounter[container.name])) {
      performanceCounter[container.name] = defaultPerformanceCounterObject;
      await set(performanceCounterKeyName, performanceCounter);
    }
  }

  async increaseContainerPerformanceCounter(container, type) {
    let time = new Date();
    let timeSegment = Math.floor(time.valueOf() / (30 * 60 * 1000));

    let { get, set } = this.practiceManager.externals.storage;
    let performanceCounter = get(performanceCounterKeyName);
    let containerPerformanceCounter = performanceCounter[container.name];

    debug(container.name, performanceCounterKeyName, containerPerformanceCounter, timeSegment);

    if (!isObject(containerPerformanceCounter[timeSegment])) {
      containerPerformanceCounter[timeSegment] = defaultPerformanceCounterObject;
    }

    let key = type === 'read' ? 'nReads' : 'nWrites';
    if (containerPerformanceCounter[timeSegment][key] >= performanceCounterPerTimeSegmentLimit) {
      logError('Warning: excessive database access detected');
    }
    containerPerformanceCounter[key] += 1;
    containerPerformanceCounter[timeSegment][key] += 1;

    await set(performanceCounterKeyName, performanceCounter);
  }

  showDBStats() {
    let { get } = this.practiceManager.externals.storage;

    let performanceCounter = get(performanceCounterKeyName);
    let text = JSON.stringify(performanceCounter, 0, 2);
    this.practiceManager.externals.editor.showTextInNewFile('stats', text);
  }

  async clearDBStats() {
    let { get, set } = this.practiceManager.externals.storage;

    let performanceCounter = get(performanceCounterKeyName);
    for (let containerName of Object.keys(performanceCounter)) {
      performanceCounter[containerName] = defaultPerformanceCounterObject;
    }

    await set(performanceCounterKeyName, performanceCounter);
  }
}
