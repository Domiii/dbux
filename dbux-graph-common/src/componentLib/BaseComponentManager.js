import Ipc from './Ipc';
import ComponentEndpoint from './ComponentEndpoint';

let _instance;
class BaseComponentManager extends ComponentEndpoint {
  /**
   * @type {BaseComponentManager}
   */
  static get instance() {
    return _instance;
  }

  _lastComponentId = 0;
  _ipcAdapter;
  _componentsById = new Map();
  /**
   * @type {ComponentEndpoint}
   */
  _root;

  constructor() {
    super();
    
    if (_instance) {
      throw new Error('Tried to create more than one ComponentManager, but should be used as singleton.');
    }
    _instance = this;
  }

  start(ipcAdapter) {
    this.ipcAdapter = ipcAdapter;
    this._initComponent(this);
  }

  addComponent(ComponentEndpointClass, initialState = {}) {
    const component = new ComponentEndpointClass();
    this._initComponent(component, initialState);
    return component;
  }

  _initComponent(component, initialState = {}) {
    const componentId = ++this._lastComponentId;
    const ipc = new Ipc(this._ipcAdapter, this);
    this._componentsById.set(componentId, component);
    component._doInit(parent, ipc, componentId, initialState);
  }
}

export default BaseComponentManager;