import RemoteCommandProxy from './RemoteCommandProxy';

class 
ComponentEndpoint {
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
  // internal stuff
  // ###########################################################################

  handlePing() {
    console.warn(this.debugTag, 'was pinged by the remote.');
  }

  _publicInternal = {
  };
}

export default ComponentEndpoint;