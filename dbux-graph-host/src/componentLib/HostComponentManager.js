import BaseComponentManager from 'dbux-graph-common/src/componentLib/BaseComponentManager';

class HostComponentManager extends BaseComponentManager {
  createComponent(parent, ComponentEndpointClass, initialState = {}) {
    const componentId = ++this._lastComponentId;
    return super.createComponent(componentId, parent, ComponentEndpointClass, initialState);
  }

  _initClient(component) {
    const {
      componentId,
      componentName,
      parent,
      state
    } = component;
    const parentId = parent?.componentId || 0;

    const args = [
      parentId,
      componentId,
      componentName,
      state
    ];
    return this.remote['_internal.createComponent'](args);
  }
}

export default HostComponentManager;