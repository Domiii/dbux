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
  };

  public = {
    async restart() {
      return this.componentManager.restart();
    }
  };
}

// TODO: create externals proxy?
const usedExternals = [
  'restart', 'logClientError', 'confirm', 'prompt', 'goToTrace'
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

    // externals.restart will result in a call to shutdown, and also re-load client code (something we cannot reliably do internally)
    await this.externals.restart();
  }

  silentShutdown() {
    this.app.dispose(true);
  }

  // ###########################################################################
  // private methods
  // ###########################################################################

  _createComponent(parent, ComponentEndpointClass, initialState = {}) {
    const componentId = ++this._lastComponentId;
    return this._registerComponent(componentId, parent, ComponentEndpointClass, initialState);
  }

  _wrapShared(component) {
    const { shared } = component;
    if (!shared) {
      return null;
    }
    if (!(shared instanceof Function)) {
      throw new Error(component.debugTag + '.shared is not a function');
    }

    const src = shared.toString();

    // make sure it is avalid function declaration expression
    if (!/^function\s+shared\s*\(\s*\)\s*\{/.test(src)) {
      throw new Error(component.debugTag + '.shared must be a function, declared like so: `function shared() { ... }` (necessary for simplifying serialization)');
    }

    return src;
  }

  async _initClient(component) {
    const {
      componentId,
      componentName,
      parent,
      state
    } = component;

    // parent
    const parentId = parent?.componentId || 0;

    // role
    const role = component._internalRoleName;

    // shared
    const shared = this._wrapShared(component);

    // send new component to client *AFTER* its parent has finished init'ing
    await parent?.waitForInit();

    return this.app._remoteInternal.createClientComponent(
      parentId,
      role,
      componentId,
      componentName,
      shared,
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