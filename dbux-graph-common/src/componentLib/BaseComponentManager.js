import Ipc from './Ipc';
import ComponentEndpoint from './ComponentEndpoint';
import { newLogger } from 'dbux-common/src/log/logger';

const { log, debug, warn, error: logError } = newLogger('dbux-graph-common/BaseComponentManager');

let _instance;
class BaseComponentManager extends ComponentEndpoint {
  /**
   * @type {BaseComponentManager}
   */
  static get instance() {
    return _instance;
  }

  _lastComponentId = 0;
  _ipcAdapter;
  _componentsById = new Map();
  /**
   * @type {ComponentEndpoint}
   */
  _root;

  constructor() {
    super();
    
    if (_instance) {
      log();
      // throw new Error('Tried to create more than one ComponentManager, but should be used as singleton.');
    }
    _instance = this;
  }

  getComponent(componentId) {
    return this._componentsById.get(componentId);
  }

  start(ipcAdapter) {
    this.ipcAdapter = ipcAdapter;
    this._registerComponent(1, null, this);
  }

  _createComponent(componentId, parent, ComponentEndpointClass, initialState = {}) {
    const component = new ComponentEndpointClass(this);
    this._registerComponent(componentId, parent, component, initialState);
    return component;
  }

  _registerComponent(componentId, parent, component, initialState = {}) {
    const ipc = new Ipc(this._ipcAdapter, this);
    this._componentsById.set(componentId, component);
    component._doInit(this, parent, ipc, componentId, initialState);
  }
}

export default BaseComponentManager;