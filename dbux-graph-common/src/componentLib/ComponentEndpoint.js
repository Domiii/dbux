import { newLogger } from 'dbux-common/src/log/logger';
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

  constructor() {
    // TODO: `this.constructor.name` won't work on Host when enabling minifcation/obfuscation in webpack/bundler
    //    NOTE: Client already has a better way for this
    this._componentName = this.constructor._componentName || this.constructor.name;
    this.logger = newLogger(this.debugTag);
  }

  _doInit(componentManager, parent, componentId, initialState) {
    this.componentManager = componentManager;
    this.parent = parent;
    this.componentId = componentId;

    this.remote = new RemoteCommandProxy(componentManager.ipc, componentId, 'public');
    this._remoteInternal = new RemoteCommandProxy(componentManager.ipc, componentId, '_publicInternal');
    this.state = initialState;
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
  // internal stuff
  // ###########################################################################

  handlePing() {
    console.warn(this.debugTag, 'was pinged by the remote.');
  }
}

export default ComponentEndpoint;