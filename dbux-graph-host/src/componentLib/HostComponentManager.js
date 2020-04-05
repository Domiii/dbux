import BaseComponentManager from 'dbux-graph-common/src/componentLib/BaseComponentManager';
import { newLogger } from 'dbux-common/src/log/logger';

const { log, debug, warn, error: logError } = newLogger('dbux-graph-host/HostComponentManager');

class HostComponentManager extends BaseComponentManager {
  _createComponent(parent, ComponentEndpointClass, initialState = {}) {
    const componentId = ++this._lastComponentId;
    return super._createComponent(componentId, parent, ComponentEndpointClass, initialState);
  }

  _initClient(component) {
    const {
      componentId,
      componentName,
      parent,
      state
    } = component;
    const parentId = parent?.componentId || 0;

    const args = [
      parentId,
      componentId,
      componentName,
      state
    ];
    return this._remoteInternal.createComponent(args);
  }

  _updateClient(component) {
    const {
      componentId,
      state
    } = component;

    const args = [
      componentId,
      state
    ];
    return this._remoteInternal.updateComponent(args);
  }
}

export default HostComponentManager;