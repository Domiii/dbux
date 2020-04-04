import BaseComponentManager from 'dbux-graph-common/src/componentLib/BaseComponentManager';
import componentRegistry from '@/_clientRegistry';

class ClientComponentManager extends BaseComponentManager {
  constructor() {
    super();

    this.initComponentRegistry();
  }

  initComponentRegistry() {
    this.componentRegistry = componentRegistry;

    for (const [name, Comp] of Object.entries(componentRegistry)) {
      Comp.componentName = name;
    }
  }

  getComponentClassByName(name) {
    return this.componentRegistry[name];
  }

  _internal = {
    async createComponent(parentId, componentId, componentName, initialState) {
      const parent = parentId && this.getComponent(parentId) || null;
      const ComponentClass = this.getComponentClassByName(componentName);
      const component = this.createComponent(parent, componentId, ComponentClass, initialState);

      // init
      const result = await component.init();

      // update
      await component.update(initialState);

      return result;
    }
  };
}

export default ClientComponentManager;