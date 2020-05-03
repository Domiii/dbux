import BaseComponentManager from 'dbux-graph-common/src/componentLib/BaseComponentManager';
import { newLogger } from 'dbux-common/src/log/logger';
import HostComponentEndpoint from './HostComponentEndpoint';

const { log, debug, warn, error: logError } = newLogger('dbux-graph-host/HostComponentManager');

class AppComponent extends HostComponentEndpoint {
  _publicInternal = {
    logClientError(args) {
      this.componentManager.externals.logClientError(args);
    },

    async confirm(...args) {
      const result = await this.componentManager.externals.confirm(...args);
      return result;
    },

    async prompt(...args) {
      const result = await this.componentManager.externals.prompt(...args);
      return result;
    }
  }
}

// TODO: create externals proxy?
const usedExternals = [
  'restart', 'logClientError', 'confirm', 'prompt'
];

class HostComponentManager extends BaseComponentManager {
  constructor(ipcAdapter, externals, componentRegistry) {
    super(ipcAdapter, componentRegistry);

    this.externals = externals;
  }

  start() {
    super.start(AppComponent);
  }
  
  async restart() {
    debug('restarting...');
    this.ipc.ipcAdapter.postMessage = (msg) => {
      // when invoked by remote, we try to send response back after shutdown. This prevents that.
      debug('silenced message after Host shutdown:', JSON.stringify(msg));
    };
    
    // externals.restart can also re-load client code (something we cannot reliably do internally)
    await this.externals.restart();
  }

  // ###########################################################################
  // private methods
  // ###########################################################################

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

    // send new component to client *AFTER* its parent has finished init'ing
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