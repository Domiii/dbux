import isPlainObject from 'lodash/isPlainObject';
import merge from 'lodash/merge';
import { newLogger } from '@dbux/common/src/log/logger';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import NestedError from '@dbux/common/src/NestedError';
import isFunction from 'lodash/isFunction';
import RemoteCommandProxy from './RemoteCommandProxy';


// eslint-disable-next-line no-unused-vars
const DefaultLogger = newLogger('ComponentEndpoint (pre init)');

/**
 * @template {ComponentEndpoint} C
 */
class ComponentEndpoint {
  /**
   * (NOTE: cannot import at top of file due to circular type resolution dependency)
   * @type {import("./BaseComponentManager").default<C>}
   */
  componentManager;

  /**
   * @type {import("./ComponentList").default<C>}
   */
  children;

  /**
   * @type {import("./ComponentList").default<C>}
   */
  controllers;

  /**
   * Parent endpoint (is null if this is the root (or "Document") endpoint)
   * @type {C}
   */
  parent;

  componentId;
  remote;
  state;
  /**
   * If aliases are given, it will show up in 
   *    `children/controllers.getChildren(x)` for every `x` in `aliases`.
   * @type {string[]}
   */
  aliases;

  _isDisposed = false;
  _disposables = [];

  /**
   * Either `child` or `contoller`, referring to the corresponding list that contains this.
   */
  _internalRoleName;

  constructor() {
    // TODO: `this.constructor.name` won't work on Host when enabling minifcation/obfuscation in webpack/bundler
    //    NOTE: Client already has a better way for this
    this.logger = DefaultLogger;
    this._componentName = this.constructor._componentName || this.constructor.name;
  }

  _build(componentManager, parent, componentId, initialStateArg) {
    this.componentManager = componentManager;
    this.parent = parent;
    this.componentId = componentId;

    this.remote = new RemoteCommandProxy(componentManager.ipc, componentId, 'public');
    this._remoteInternal = new RemoteCommandProxy(componentManager.ipc, componentId, '_publicInternal');

    this.state = this.makeInitialState(initialStateArg);
    this.logger = newLogger(this.debugTag);
  }

  makeInitialState(initialStateArg) {
    return initialStateArg;
  }

  /**
   * Initialize `shared` and `context`.
   */
  _preInit() {
    if (this.context) {
      throw new Error(`${this.debugTag} has assigned a context in the wrong place. Make sure to only assign context in shared function.`);
    }

    // run shared
    try {
      const sharedResult = this.shared?.();
      if (isPlainObject(sharedResult)) {
        // store returned object in `this`
        Object.assign(this, sharedResult);
      }

      // assign context
      this.context = Object.freeze({
        ...(this.parent?.context || EmptyObject),
        ...(this.context || EmptyObject)
      });
    }
    catch (err) {
      throw new NestedError(`${this.debugTag} Failed to initialize shared context. ` +
        `IMPORTANT: "shared" function is executed on host and client. Make sure to only reference symbols available on both.`, err);
    }
  }

  _getComponentListByRoleName(role) {
    switch (role) {
      case 'child': {
        return this.children;
      }
      case 'controller': {
        return this.controllers;
      }
      default: {
        throw new Error('unknown role: ' + role);
      }
    }
  }

  // ###########################################################################
  // Getters
  // ###########################################################################

  get app() {
    return this.componentManager.app;
  }

  get debugTag() {
    return `[${this.componentName}]`;
  }

  get componentName() {
    return this._componentName;
  }

  /**
   * NOTE: logically speaking, a `parent` sometimes plays more of the role of `owner` in certain relationships.
   *        E.g. This name makes more sense for pure controller components (that do not have their own DOM elements).
   */
  get owner() {
    return this.parent;
  }

  get isDisposed() {
    return this._isDisposed;
  }

  // ###########################################################################
  // event overloads
  // ###########################################################################

  /**
   * @virtual
   */
  init() {
  }

  /**
   * Called when state is updated.
   * 
   * @virtual
   */
  update() {
  }

  // /**
  //  * @virtual
  //  */
  // childrenChanged() {
  // }

  // ###########################################################################
  // dispose
  // ###########################################################################

  addDisposable(...disps) {
    this._disposables.push(...disps);
  }

  dispose(/* silent = false */) {
    this._isDisposed = true;

    this._disposables.forEach((disp) => {
      if (isFunction(disp)) {
        disp();
      }
      else {
        disp.dispose();
      }
    });
  }

  // ###########################################################################
  // internal stuff
  // ###########################################################################
  StateUpdaters = {
    arrayAdd: (state, delta) => {
      for (const key in delta) {
        const orig = state[key];
        const upd = delta[key];
        if (!Array.isArray(orig)) {
          throw new Error(`Cannot apply state op "arrayAdd" for key "${key}" in comp "${this.debugTag}": orig is not array`);
        }

        try {
          state[key] = orig.concat(upd);
        }
        catch (err) {
          this.logger.error(new NestedError(`setState → arrayAdd failed - for array "${key}" (orig.length=${orig.length}, upd.length=${upd?.length})`, err));
        }
      }
    },
    objectMerge: (state, delta) => {
      // console.log('objectMerge', delta);
      for (const key in delta) {
        const orig = state[key];
        const upd = delta[key];

        state[key] = merge(orig || {}, upd);
      }
    }
  };

  _updateState(stateDelta, stateOps) {
    if (stateDelta) {
      Object.assign(this.state, stateDelta);
    }
    if (stateOps) {
      for (const op in stateOps) {
        const updater = this.StateUpdaters[op];
        if (!updater) {
          throw new Error(`State op does not exist in comp "${this.debugTag}": ${op}`);
        }
        updater(this.state, stateOps[op]);
      }
    }
    // console.log(`_updateState`, stateDelta, stateOps, '|', this.state);
  }

  handlePing() {
    // console.warn(this.debugTag, 'was pinged by the remote.');
  }

  toString() {
    return this.debugTag;
  }
}

export default ComponentEndpoint;