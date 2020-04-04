import RemoteCommandProxy from './RemoteCommandProxy';
import Ipc from './Ipc';

class ComponentEndpoint {
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
  }

  _doInit(parent, componentId, ipc, initialState) {
    this.parent = parent;
    this.componentId = componentId;
    this.ipc = ipc;
    this.remote = new RemoteCommandProxy(ipc, componentId);
    this.state = initialState;
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
  // internal base commands
  // ###########################################################################

  _internalBase = {
  };
}

export default ComponentEndpoint;