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

  constructor(ipcAdapter, componentRegistry) {
    this.ipc = new Ipc(ipcAdapter, this);

    // component registry
    this.initComponentRegistry(componentRegistry);
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
    component._build(this, parent, componentId, initialState);
    return component;
  }

  // ###########################################################################
  // componentRegistry
  // ###########################################################################

  initComponentRegistry(componentRegistry) {
    // register all components by name
    this.componentRegistry = componentRegistry;
    for (const [name, Comp] of Object.entries(componentRegistry)) {
      Comp._componentName = name;
    }
  }
}

export default BaseComponentManager;