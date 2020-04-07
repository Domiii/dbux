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

      // NOTE: parent should never be null (except for AppComponent, which does not get initialized this way)

      const ComponentClass = this.componentManager.getComponentClassByName(componentName);
      const component = this.componentManager._registerComponent(componentId, parent, ComponentClass, initialState);

      // init
      const result = await component._performInit();

      // update
      await component._performUpdate();

      return result;
    }
  };

  prompt(...args) {
    return this._remoteInternal.prompt(...args);
  }
}

// ###########################################################################
// ClientComponentManager
// ###########################################################################

class ClientComponentManager extends BaseComponentManager {
  constructor(ipcAdapter) {
    super(ipcAdapter);

    // component registry
    this.initComponentRegistry();
  }

  initComponentRegistry() {
    // add hard-coded AppComponent
    componentRegistry.AppComponent = AppComponent;

    // register all components by name
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

    // NOTE: usually `init` is called by Host, but AppComponent is a special case
    this.app._performInit();
  }
}

export default ClientComponentManager;