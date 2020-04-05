import { newLogger } from 'dbux-common/src/log/logger';
import Ipc from './Ipc';
import ComponentEndpoint from './ComponentEndpoint';

const { log, debug, warn, error: logError } = newLogger('dbux-graph-common/BaseComponentManager');

class BaseComponentManager extends ComponentEndpoint {
  _lastComponentId = 0;
  _ipcAdapter;
  _componentsById = new Map();
  /**
   * @type {ComponentEndpoint}
   */
  _root;

  constructor() {
    super();
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