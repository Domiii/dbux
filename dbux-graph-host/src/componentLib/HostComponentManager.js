import BaseComponentManager from 'dbux-graph-common/src/componentLib/BaseComponentManager';
import { newLogger } from 'dbux-common/src/log/logger';
import HostComponentEndpoint from './HostComponentEndpoint';

const { log, debug, warn, error: logError } = newLogger('dbux-graph-host/HostComponentManager');

class AppComponent extends HostComponentEndpoint {
}

class HostComponentManager extends BaseComponentManager {
  constructor(ipcAdapter, externals) {
    super(ipcAdapter);

    this.externals = externals;
  }

  start() {
    super.start(AppComponent);
  }

  _createComponent(parent, ComponentEndpointClass, initialState = {}) {
    const componentId = ++this._lastComponentId;
    return this._registerComponent(componentId, parent, ComponentEndpointClass, initialState);
  }

  async _initClient(component) {
    const {
      componentId,
      componentName,
      parent,
      state
    } = component;
    const parentId = parent?.componentId || 0;

    // send only to client after parent has finished init'ing
    await parent?.waitForInit();

    return this.app._remoteInternal.createComponent(
      parentId,
      componentId,
      componentName,
      state
    );
  }

  _updateClient(component) {
    const {
      componentId,
      state
    } = component;

    return this.app._remoteInternal.updateComponent(
      componentId,
      state
    );
  }
}

export default HostComponentManager;