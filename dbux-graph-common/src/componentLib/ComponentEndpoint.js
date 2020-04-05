import RemoteCommandProxy from './RemoteCommandProxy';
import Ipc from './Ipc';

class ComponentEndpoint {
  componentManager;
  
  /**
   * Parent endpoint (is null if this is the root (or "Document") endpoint)
   */
  parent;

  componentId;
  /**
   * @type {Ipc}
   */
  ipc;
  remote;
  state;

  constructor() {
    // TODO: `this.constructor.name` won't work on Host when enabling minifcation/obfuscation in webpack/bundler
    //    NOTE: Client already has a better way for this
    this._componentName = this.constructor._componentName || this.constructor.name;
  }

  _doInit(componentManager, parent, componentId, ipc, initialState) {
    this.componentManager = componentManager;
    this.parent = parent;
    this.componentId = componentId;
    this.ipc = ipc;
    this.remote = new RemoteCommandProxy(ipc, componentId, 'public');
    this._remoteInternal = new RemoteCommandProxy(ipc, componentId, '_publicInternal');
    this.state = initialState;
  }

  // ###########################################################################
  // Getters
  // ###########################################################################

  get debugTag() {
    return `[${this.componentName}]`;
  }

  get componentName() {
    return this._componentName;
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
  // internal base commands
  // ###########################################################################

  _publicInternal = {
  };
}

export default ComponentEndpoint;