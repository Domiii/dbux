class ComponentManager {
  _lastComponentId = 0;

  constructor() {
    this.ipc = new Ipc(ipcAdapter);
  }

  addComponent(ComponentEndpointClass, initialProps) {
    const id = ++this._lastComponentId;

    const component = new ComponentEndpointClass(id, initialProps);
    return component;
  }
}

const componentManager = new ComponentManager();
export default componentManager;