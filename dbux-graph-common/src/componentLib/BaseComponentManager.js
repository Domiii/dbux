import { newLogger } from 'dbux-common/src/log/logger';
import Ipc from './Ipc';
import ComponentEndpoint from './ComponentEndpoint';

const { log, debug, warn, error: logError } = newLogger('dbux-graph-common/BaseComponentManager');

class BaseComponentManager {
  _lastComponentId = 1; // 1 is reserved for App
  _componentsById = new Map();

  /**
   * @type {ComponentEndpoint}
   */
  app;

  constructor(ipcAdapter) {
    this.ipc = new Ipc(ipcAdapter, this);
  }

  hasStarted() {
    return this._lastComponentId > 0;
  }

  getComponent(componentId) {
    return this._componentsById.get(componentId);
  }

  start(AppComponentClass) {
    return this.app = this._registerComponent(1, null, AppComponentClass);
  }

  _registerComponent(componentId, parent, ComponentEndpointClass, initialState = {}) {
    const component = new ComponentEndpointClass(this);
    this._componentsById.set(componentId, component);
    component._doInit(this, parent, componentId, initialState);
    return component;
  }
}

export default BaseComponentManager;