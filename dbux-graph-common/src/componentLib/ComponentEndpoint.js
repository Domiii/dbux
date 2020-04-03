class ComponentEndpoint {
  componentId;
  remote;
  state;

  /**
   * The index in the parent's children array.
   */
  index;
  parent;

  constructor() {
    
  }

  _doInit(ipc, componentId, initialState) {
    this.componentId = componentId;
    this.remote = new RemoteCommandProxy(ipc, componentId);
    this.state = initialState;

    // TODO: set index + parent
    this.index = ;
    this.parent = ;
  }

  // ###########################################################################
  // Manage children
  // ###########################################################################

  reset() {
    this.setChildren([]);
  }

  setChildren(children) {
    // TODO
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
   * @virtual
   */
  update(oldState) {
  }

  /**
   * @virtual
   */
  childrenChanged() {
  }

  // ###########################################################################
  // static
  // ###########################################################################

  static create(initialState) {
    // TODO: register component instance and get everything we need from `componentManager`
  }
}

export default ComponentEndpoint;