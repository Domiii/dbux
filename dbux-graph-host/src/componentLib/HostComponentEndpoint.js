import noop from 'lodash/noop';
import ComponentEndpoint from 'dbux-graph-common/src/componentLib/ComponentEndpoint';
import sleep from 'dbux-common/src/util/sleep';
import HostComponentList from './HostComponentList';

const Verbose = true;
// const Verbose = false;

/**
 * The Host endpoint controls the Client endpoint.
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

  _isInitialized = false;
  _initPromise;
  _waitingForUpdate;
  _updatePromise;
  _stateLockOwner;


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

  /**
   * Update without changing state.
   */
  forceUpdate() {
    this._startUpdate();
  }

  forceUpdateTree() {
    // TODO: forceUpdate of self and all components in subtree
    throw new Error('NYI');
  }

  waitForInit() {
    // NOTE: make sure, `waitFor` calls fulfill in order by appending our own task into the promise chain
    // return this._initPromise = this._initPromise.then(noop);
    return this._initPromise;
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
  // _build
  // ###########################################################################

  /**
   * NOTE: this is called by `BaseComponentManager._createComponent`
   */
  _build(componentManager, parent, componentId, initialState) {
    // store properties
    super._build(componentManager, parent, componentId, initialState);

    try {
      this._preInit();                                    // 0. host: preInit
      this._runNoSetState('init');                        // 1. host: init
      Verbose && this.logger.debug('init called');
      this._runNoSetState('update');                      // 2. host: update
    }
    catch (err) {
      this.logger.error('init or initial update failed on host\n  ', err);
    }

    // do the long async init dance
    this._initPromise = Promise.resolve()
      .then(this._doInit.bind(this)).
      catch(err => {
        this.logger.error('error when initializing client\n  ', err);
        return null;
      }).finally(() => {
        // _initPromise has fulfilled its purpose
        this._initPromise = null;
      });
  }

  async _doInit() {
    await sleep();    // hackfix: this way `_initPromise` can be assigned correctly
    const resultFromClientInit = this.parent && await this.componentManager._initClient(this); // 3. client: init -> update (ignore `internal root component`)
    // success                                        // 4. waitForInit resolved
    Verbose && this.logger.debug('initialized');
    this._isInitialized = true;
    return resultFromClientInit;
  }

  // ###########################################################################
  // update queue logic
  // ###########################################################################

  async _startUpdate() {
    if (!this.isInitialized) {
      // make sure, things are initialized
      await this.waitForInit();
    }
    if (!this.isInitialized) {
      throw new Error(`${this.debugTag} - first update detected before init has started. Make sure to not call setState or before initialization has started.`);
    }

    // NOTE: this is called by `setState`
    if (this._waitingForUpdate) {
      // already waiting for update -> will send out changes in a bit anyway
      return;
    }

    if (this._updatePromise) {
      // if already has update pending -> add self to queue to update again afterwards
      this._updatePromise.then(() => {
        this._updatePromise = this._executeUpdate();
      });
    }
    else {
      // send update out right away
      this._updatePromise = this._executeUpdate();
    }
  }

  async _executeUpdate() {
    // debounce mechanism
    this._waitingForUpdate = true;
    await sleep(0);
    this._waitingForUpdate = false;

    // push out new update
    const promise = Promise.resolve(
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
          this.logger.error('error when updating client\n  ', err);
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