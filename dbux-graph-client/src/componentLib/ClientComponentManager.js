import BaseComponentManager from 'dbux-graph-common/src/componentLib/BaseComponentManager';
import componentRegistry from '@/_clientRegistry';
import ClientComponentEndpoint from './ClientComponentEndpoint';

// ###########################################################################
// ClientApp
// ###########################################################################

class AppComponent extends ClientComponentEndpoint {
  init() {
    // nothing to do
  }

  confirm(...args) {
    return this._remoteInternal.confirm(...args);
  }

  prompt(...args) {
    return this._remoteInternal.prompt(...args);
  }

  _publicInternal = {
    async createComponent(parentId, componentId, componentName, initialState) {
      const parent = this.componentManager.getComponent(parentId);

      // NOTE: parent should never be null (except for AppComponent, which does not get initialized this way)

      const ComponentClass = this.componentManager.getComponentClassByName(componentName);

      // NOTE: `_registerComponent` also calls `_doInit`
      const component = this.componentManager._registerComponent(componentId, parent, ComponentClass, initialState);

      // init
      const result = await component._performInit();

      // update
      await component._performUpdate();

      return result;
    }
  };
}

// ###########################################################################
// ClientComponentManager
// ###########################################################################

class ClientComponentManager extends BaseComponentManager {
  constructor(ipcAdapter) {
    // add hard-coded AppComponent
    componentRegistry.AppComponent = AppComponent;
    super(ipcAdapter, componentRegistry);
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