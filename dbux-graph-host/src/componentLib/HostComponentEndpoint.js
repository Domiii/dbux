import noop from 'lodash/noop';
import NanoEvents from 'nanoevents';
import sleep from '@dbux/common/src/util/sleep';
import ComponentEndpoint from '@dbux/graph-common/src/componentLib/ComponentEndpoint';
import NestedError from '@dbux/common/src/NestedError';
import HostComponentList from './HostComponentList';

// const Verbose = true;
const Verbose = false;

/**
 * The Host endpoint controls the Client endpoint.
 * @extends ComponentEndpoint<HostComponentEndpoint>
 */
class HostComponentEndpoint extends ComponentEndpoint {
  /**
   * @type {HostComponentList}
   */
  children;
  /**
   * Controllers are similar to children but usually have no DOM representation, and usually
   * aim to act on "actual" "children" of their owner instead.
   * @type {HostComponentList}
   */
  controllers;

  /**
   * Can be assigned via `createComponent`.
   * @type {Object}
   */
  hostOnlyState;

  _isInitialized = false;
  _initPromise;
  _waitingForUpdate;
  _updatePromise;
  _stateLockOwner;

  _refreshPromise = null;
  _refreshRequests = 0;
  _finishedDisposed = false;


  constructor() {
    super();

    this.children = new HostComponentList(this, 'child');
    this.controllers = new HostComponentList(this, 'controller');
  }

  get isInitializing() {
    return !!this._initPromise;
  }

  get isInitialized() {
    return this._isInitialized;
  }
  /**
   * @type {import("./HostComponentManager").default}
   */
  get componentManager() {
    return super.componentManager;
  }

  setState(update) {
    if (this._stateLockOwner) {
      // NOTE 0: `setState` is supposed to be used in event handlers.
      // NOTE 1: in `init`, you can directly manipulate `this.state`
      // NOTE 2: in `update`, don't touch `setState`
      throw new Error(this.debugTag + ` Tried to call setState during "${this.componentName}.${this._stateLockOwner}". Only use it in event handlers.`);
    }

    if (this._isDisposed) {
      throw new Error(this.debugTag + ` Tried to call setState after disposed`);
    }

    Object.assign(this.state, update);

    this._startUpdate();
  }

  /**
   * Update without changing state.
   */
  forceUpdate() {
    this._startUpdate();
  }

  forceUpdateDescendants() {
    for (const child of this.children) {
      child.forceUpdateTree();
    }
  }

  forceUpdateTree() {
    this.forceUpdate();
    this.forceUpdateDescendants();
  }

  async waitForInit() {
    // NOTE: make sure, `waitFor` calls fulfill in order by appending our own task into the promise chain
    // return this._initPromise = this._initPromise.then(noop);
    while (this._initPromise) {
      await this._initPromise;
    }

    if (!this.isInitialized) {
      throw new Error(`${this.debugTag} - first update detected before init has started. Make sure to not call setState before initialization has started.`);
    }
  }

  async waitForUpdate() {
    // make sure, init has finished
    await this.waitForInit();

    // hackfix: while waiting, there is no promise available yet
    //    NOTE: we can probably create the updatePromise while waiting already
    while (this._waitingForUpdate) {
      await sleep(0);
    }

    if (this._updatePromise) {
      await (this._updatePromise = this._updatePromise.then(noop));
    }
  }

  /**
   * Returns a promise that settles when `init`, `update` and `refresh` are all fulfilled.
   */
  async waitForAll() {
    await Promise.all([
      this.waitForInit(),
      this.waitForUpdate(),
      this.waitForRefresh()
    ]);
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
  // _build + init
  // ###########################################################################

  /**
   * NOTE: this is called by `BaseComponentManager._createComponent`
   */
  _build(componentManager, parent, componentId, initialState, hostOnlyState) {
    // store properties
    super._build(componentManager, parent, componentId, initialState);
    this.hostOnlyState = hostOnlyState;

    componentManager.incInitCount();

    this._initPromise = new Promise(r => {
      // do the long async init dance
      // [hackfix] we are delaying `initClient` via `resolve().then()` because it needs `_internalRoleName` (and maybe other stuff?), 
      //    which will be set after `_build` was called.
      //    This is not good, since `init` might also want that data but it is called immediately.
      //    see: https://gist.github.com/Domiii/1eeedd50d911ee8a651a2452594443a5#when-are-chained-callbacks-in-promises-resolved
      Promise.resolve().
        then(this._doInitClient.bind(this)).
        catch(err => {
          this.logger.error('Failed to initialize client\n  ', err);
          return null;
        }).
        finally(() => {
          // _initPromise has fulfilled its purpose
          this._initPromise = null;
          componentManager.decInitCount();
          r();
        });
    });

    // start initHost after `_initPromise` has been assigned
    this._initHost();
  }

  _initHost() {
    try {
      this._waitingForUpdate = true;
      this._preInit();                                    // 0. host: preInit
      Verbose && this.logger.debug('init start');
      this.init();                                        // 1. host: init
      Verbose && this.logger.debug('update start');
      this.update();                                      // 2. host: update
    }
    catch (err) {
      throw new NestedError(`${this.debugTag} init or initial update failed on host.`, err);
    }
    finally {
      this._waitingForUpdate = false;
    }
  }

  async _doInitClient() {
    Verbose && this.logger.debug('_doInitClient start');
    const resultFromClientInit = this.parent && await this.componentManager._initClient(this); // 3. client: init -> update (ignore `internal root component`)
    // success                                        // 4. waitForInit resolved
    Verbose && this.logger.debug('initialized');
    this._isInitialized = true;
    return resultFromClientInit;
  }

  // ###########################################################################
  // update queue logic
  // ###########################################################################

  async _startUpdate(updateCb = this._executeUpdate) {
    // NOTE: this is called by `setState`
    if (this._waitingForUpdate) {
      // already waiting for update -> will send out changes in a bit anyway
      return;
    }

    if (!this.isInitialized) {
      // make sure, things are initialized
      await this.waitForInit();
    }

    // NOTE: this is called by `setState`
    if (this._waitingForUpdate) {
      // already waiting for update -> will send out changes in a bit anyway
      return;
    }

    if (this._updatePromise) {
      // if already has update pending -> add self to queue to update again afterwards
      this._updatePromise.then(() => {
        this._updatePromise = updateCb();
      });
    }
    else {
      // send update out right away
      this._updatePromise = updateCb();
    }
  }

  _performUpdate() {
    try {
      this.update();
    }
    finally {
      this._waitingForUpdate = false;
    }
  }

  _executeUpdate = async () => {
    // debounce mechanism
    this._waitingForUpdate = true;
    await sleep(0);

    // push out new update
    const promise = Promise.resolve(
      this._performUpdate()                                   // 1. host: update
    ).
      then(() => {
        return this._remoteInternal.updateClient(this.state); // 2. client: update
      }).
      then(
        (resultFromClientInit) => {
          // success                                          // 3. waitForUpdate (resolved)
          return resultFromClientInit;
        },
        (err) => {
          // error :(
          this.logger.error(`Error when updating client. Check client for stack trace. (${err?.message || err})`);
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

  // _executeContextUpdate = async () => {
  //   // debounce mechanism
  //   this._waitingForUpdate = true;
  //   await sleep(0);

  //   // push out new update
  //   const promise = Promise.resolve(
  //     this._performUpdate()                                   // 1. host: update
  //   ).
  //     then(() => {
  //       return this._remoteInternal.updateContext(this.context); // 2. client: update
  //     }).
  //     then(
  //       (resultFromClientInit) => {
  //         // success                                          // 3. waitForUpdate (resolved)
  //         return resultFromClientInit;
  //       },
  //       (err) => {
  //         // error :(
  //         this.logger.error('Error when updating context on client. Check client for stack trace.');
  //       }
  //     ).
  //     finally(() => {
  //       if (promise === this._updatePromise) {
  //         // last in queue -> unset
  //         this._updatePromise = null;
  //       }
  //     });

  //   return promise;
  // }

  // ###########################################################################
  // refresh
  // ###########################################################################

  /**
   * @abstract
   */
  handleRefresh() {
    throw new Error(`${this.componentName}.handleRefresh not implemented`);
  }

  /**
   * A refresh is usually triggered by some data change event handler.
   * A refresh implies:
   *   1. waiting for initialization of previously added components
   *   2. changing the graph (usually implemented in `handleRefresh`)
   *   3. waiting for initialization of newly added components
   */
  async waitForRefresh() {
    return this._refreshPromise;
  }

  /**
   * Triggers a refresh, if not already in progress.
   * Use `waitForRefresh` to wait until it's done.
   */
  refresh = () => {
    ++this._refreshRequests;
    if (this._refreshPromise) {
      return;
    }
    this._refreshPromise = this._doRefresh();
  };

  async _doRefresh() {
    try {
      await sleep(50); // implicit debounce
      while (this._refreshRequests) {
        this._refreshRequests = 0;

        // wait for init before dispose something
        await this.componentManager.waitForBusyInit();

        this.handleRefresh();

        // wait for init to ensure client side finished
        await this.componentManager.waitForBusyInit();
      }
      this._refreshPromise = null;
      if (!this._emitter) {
        this._emitter = new NanoEvents();
      }
      this._emitter.emit('refresh');
    }
    catch (err) {
      this.logger.error(`Refresh failed: ${err.stack}`);
    }
    finally {
      this._refreshPromise = null;
    }
  }

  // ###########################################################################
  // removing + disposing
  // ###########################################################################

  clearChildren(silent = false) {
    this.children.clear(silent);
    this.controllers.clear(silent);
  }

  /**
   * First disposes all descendants (removes recursively) and then removes itself.
   */
  dispose(silent = false) {
    Verbose && this.logger.debug('dispose start');
    super.dispose();

    // Promise.resolve(this.waitForInit()).then(() => {
    // if (!this.isInitialized && !silent) {
    //   throw new Error(this.debugTag + ' Trying to dispose before initialized');
    // }

    this.clearChildren(silent);

    // remove from parent
    if (this.owner) {
      const list = this.owner._getComponentListByRoleName(this._internalRoleName);
      list._removeComponent(this);
    }

    // also dispose on client
    Promise.resolve(this.waitForInit())
      .then(async () => {
        await this._remoteInternal.dispose();
        Verbose && this.logger.debug('disposed');
      })
      .catch((err) => {
        if (!silent) {
          this.logger.error('error while disposing -', err);
        }
        else {
          Verbose && this.logger.debug('error while disposing');
        }
      })
      .finally(() => {
        this._finishedDisposed = true;
      });
  }

  async waitForClear() {
    let waiting = true;
    let doneWaiting = false;
    await Promise.race([
      (async () => {
        while (waiting) {
          await sleep(20);
          if (this._finishedDisposed) {
            break;
          }
        }
      })(),
      sleep(2000)
    ]);
    waiting = false;
    return doneWaiting;
  }

  // ###########################################################################
  // internal commands
  // ###########################################################################

  _publicInternal = {
    forceUpdate: this.forceUpdate,
    setState: this.setState
  }

  // ###########################################################################
  // static
  // ###########################################################################
}

export default HostComponentEndpoint;