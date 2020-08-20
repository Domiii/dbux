import isPlainObject from 'lodash/isPlainObject';
import { newLogger } from '@dbux/common/src/log/logger';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import isFunction from 'lodash/isFunction';
import RemoteCommandProxy from './RemoteCommandProxy';

class ComponentEndpoint {
  componentManager;

  /**
   * Parent endpoint (is null if this is the root (or "Document") endpoint)
   */
  parent;

  componentId;
  remote;
  state;

  _isDisposed = false;
  _disposables = [];

  constructor() {
    // TODO: `this.constructor.name` won't work on Host when enabling minifcation/obfuscation in webpack/bundler
    //    NOTE: Client already has a better way for this
    this._componentName = this.constructor._componentName || this.constructor.name;
    this.logger = newLogger(this.debugTag);
  }

  _build(componentManager, parent, componentId, initialStateArg) {
    this.componentManager = componentManager;
    this.parent = parent;
    this.componentId = componentId;

    this.remote = new RemoteCommandProxy(componentManager.ipc, componentId, 'public');
    this._remoteInternal = new RemoteCommandProxy(componentManager.ipc, componentId, '_publicInternal');

    this.state = this.makeInitialState(initialStateArg);
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

  addDisposable(disp) {
    this._disposables.push(disp);
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

  handlePing() {
    // console.warn(this.debugTag, 'was pinged by the remote.');
  }

  toString() {
    return this.debugTag;
  }
}

export default ComponentEndpoint;