import BaseComponentManager from 'dbux-graph-common/src/componentLib/BaseComponentManager';
import componentRegistry from '@/_clientRegistry';
import ClientComponentEndpoint from './ClientComponentEndpoint';

// ###########################################################################
// ClientApp
// ###########################################################################

class AppComponent extends ClientComponentEndpoint {
  _publicInternal = {
    async createComponent(parentId, componentId, componentName, initialState) {
      const parent = this.componentManager.getComponent(parentId);
      
      // NOTE: parent should never be null

      const ComponentClass = this.componentManager.getComponentClassByName(componentName);
      const component = this.componentManager._registerComponent(componentId, parent, ComponentClass, initialState);

      // init
      const result = await component.init();

      // update
      await component.update();

      return result;
    }
  };
}

// ###########################################################################
// ClientComponentManager
// ###########################################################################

class ClientComponentManager extends BaseComponentManager {
  constructor(ipcAdapter) {
    super(ipcAdapter);

    this.initComponentRegistry();
  }

  initComponentRegistry() {
    this.componentRegistry = componentRegistry;

    for (const [name, Comp] of Object.entries(componentRegistry)) {
      Comp._componentName = name;
    }
  }

  getComponentClassByName(name) {
    return this.componentRegistry[name];
  }

  start() {
    super.start(AppComponent);
  }
}

export default ClientComponentManager;