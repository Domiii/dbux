import BaseComponentManager from 'dbux-graph-common/src/componentLib/BaseComponentManager';

class ClientComponentManager extends BaseComponentManager {
  _internal = {
    initComponent() {
      // TODO: finish this up
      const ComponentClass = registry.getByName(componentName);
      manager.addComponent(ComponentClass, initialState);
    }
  }
}

export default ClientComponentManager;