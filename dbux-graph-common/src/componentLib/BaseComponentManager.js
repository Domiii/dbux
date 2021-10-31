import { newLogger } from '@dbux/common/src/log/logger';
import Ipc from './Ipc';
import ComponentEndpoint from './ComponentEndpoint';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('dbux-graph-common/BaseComponentManager');

class BaseComponentManager {
  _lastComponentId = 1; // 1 is reserved for App
  _componentsById = new Map();

  /**
   * @type {ComponentEndpoint}
   */
  app;

  constructor(componentRegistry, ipcAdapter) {
    this.ipc = new Ipc(ipcAdapter, this, this.endpointName);

    // component registry
    this.initComponentRegistry(componentRegistry);
  }

  get endpointName() {
    throw new Error(`Abstract getter not implemented`);
  }

  hasStarted() {
    return this._lastComponentId > 1;
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