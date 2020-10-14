import NanoEvents from 'nanoevents';
import BaseComponentManager from '@dbux/graph-common/src/componentLib/BaseComponentManager';
import { newLogger } from '@dbux/common/src/log/logger';
import HostComponentEndpoint from './HostComponentEndpoint';

// eslint-disable-next-line no-unused-vars
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
    super(componentRegistry, ipcAdapter);

    this.externals = externals;
    this._initCount = 0;
    this._emitter = new NanoEvents();
  }

  start() {
    super.start(AppComponent);
  }

  async restart() {
    debug('restarting...');
    // this.silentShutdown();

    // externals.restart will result in a call to shutdown, and also re-load client code (something we cannot reliably do internally)
    await this.externals.restart();
  }

  silentShutdown() {
    this.app?.dispose(true);
    this.ipc.ipcAdapter.dispose();
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

    let src = shared.toString().trim();

    if (/^shared\s*\(\s*\)\s*\{/.test(src)) {
      src = `function ${src}`;
    }
    
    // make sure it is a valid function declaration expression
    if (!/^function\s*(shared)?\s*\(\s*\)\s*\{/.test(src)) {
      // eslint-disable-next-line max-len
      throw new Error(component.debugTag + '.shared must be an es5-style function, declared like so: `function shared() { ... }` (necessary for simplifying serialization). Found:\n\n' + src);
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

  // ###########################################################################
  // manage init count
  // ###########################################################################

  setInitCount(n) {
    const oldState = this.isBusyInit();

    this._initCount += n;

    const newState = this.isBusyInit();

    if (oldState !== newState) {
      if (newState) {
        // free to busy
        this._busyInitPromise = new Promise((r) => {
          this._resolveInitPromise = r;
        });
      }
      else {
        // busy to free

        const r = this._resolveInitPromise;
        this._resolveInitPromise = null;
        this._busyInitPromise = null;
        r();
      }
      this._emitter.emit('busyStateChanged', newState);
    }
  }

  incInitCount() {
    this.setInitCount(1);
  }

  decInitCount() {
    this.setInitCount(-1);
  }

  isBusyInit() {
    return !!this._initCount;
  }

  onBusyStateChanged(cb) {
    return this._emitter.on('busyStateChanged', cb);
  }

  waitForBusyInit() {
    return this._busyInitPromise;
  }
}

export default HostComponentManager;