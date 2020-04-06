import ComponentEndpoint from 'dbux-graph-common/src/componentLib/ComponentEndpoint';
import sleep from 'dbux-common/src/util/sleep';
import { newLogger } from 'dbux-common/src/log/logger';
import HostComponentList from './HostComponentList';

const { log, debug, warn, error: logError } = newLogger('dbux-graph-host/HostComponentEndpoint');

/**
 * The Host endpoint controls the Client endpoint.
 */
class HostComponentEndpoint extends ComponentEndpoint {
  /**
   * @type {HostComponentList}
   */
  children;

  _isInitialized = false;
  _initPromise;
  _waitingForUpdate;
  _updatePromise;
  _stateLockOwner;


  constructor() {
    super();

    this.children = new HostComponentList(this);
  }

  get isInitializing() {
    return !!this._initPromise;
  }

  get isInitialized() {
    return this._isInitialized;
  }

  setState(update) {
    if (this._stateLockOwner) {
      // NOTE 0: `setState` is supposed to be used in event handlers.
      // NOTE 1: in `init`, you can directly manipulate `this.state`
      // NOTE 2: in `update`, don't touch `setState`
      throw new Error(this.debugTag + ` Tried to call setState during "${this.componentName}.${this._stateLockOwner}". Only use it in event handlers.`);
    }

    Object.assign(this.state, update);

    this._startUpdate();
  }

  waitForInit() {
    return this._initPromise;
  }

  waitForUpdate() {
    return this._updatePromise;
  }

  // ###########################################################################
  // utilities
  // ###########################################################################

  /**
   * make sure that `setState` is not called during `update` nor `init`
   */
  _runNoSetState(method, args) {
    this._stateLockOwner = method;
    const result = this[method].apply(this, args);
    this._stateLockOwner = null;
    return result;
  }

  // ###########################################################################
  // _doInit
  // ###########################################################################

  _doInit(componentManager, parent, componentId, initialState) {
    super._doInit(componentManager, parent, componentId, initialState);

    // NOTE: this is called by `BaseComponentManager._createComponent`

    this._initPromise = Promise.resolve(
      this._runNoSetState('init')                       // 1. host: init
    ).   
      then(this.update.bind(this)).                     // 2. host: update
      then(() => (
        parent && this.componentManager._initClient(this)// 3. client: init -> update
      )).
      then(
        (resultFromClientInit) => {
          // success                                    // 4. waitForInit (resolved)
          this._isInitialized = true;
          return resultFromClientInit;
        },
        (err) => {
          // error :(
          logError(this.debugTag, 'failed to initialize client - error occured (probably on client)\n  ', err);
        }
      ).
      finally(() => {
        // _initPromise has fulfilled its purpose
        this._initPromise = null;
      });
  }

  // ###########################################################################
  // update queue logic
  // ###########################################################################

  async _startUpdate() {
    // make sure, things are initialized
    await this.waitForInit();

    // NOTE: this is called by `setState`
    if (this._waitingForUpdate) {
      // already waiting for update -> will send out changes in a bit anyway
      return this._updatePromise;
    }

    if (this._updatePromise) {
      // if already has update pending -> add self to queue
      return this._updatePromise = this._updatePromise.then(() => {
        return this._executeUpdate();
      });
    }

    return this._executeUpdate();
  }

  async _executeUpdate() {
    this._waitingForUpdate = true;
    await sleep(0);
    this._waitingForUpdate = false;

    // push out new update
    const promise = this._updatePromise = Promise.resolve(
      this._runNoSetState('update')                           // 1. host: update
    ).
      then(() => (
        this._remoteInternal.updateClient(this.state)         // 2. client: init -> update
      )).
      then(
        (resultFromClientInit) => {
          // success                                          // 3. waitForUpdate (resolved)
          return resultFromClientInit;
        },
        (err) => {
          // error :(
          logError(this.debugTag, 'failed to update client - error occured (probably on client)\n  ', err);
        }
      ).
      finally(() => {
        if (promise === this._updatePromise) {
          // last in queue -> unset
          this._updatePromise = null;
        }
      });

    return promise;
  }

  // ###########################################################################
  // removing + disposing
  // ###########################################################################


  /**
   * First disposes all descendants (removes recursively) and then removes itself.
   */
  dispose() {
    for (const child of this.children) {
      child.dispose();
    }

    // remove from parent
    this.parent.children._removeComponent(this);

    // also dispose on client
    return this._remoteInternal.dispose();
  }

  // ###########################################################################
  // static
  // ###########################################################################
}

export default HostComponentEndpoint;