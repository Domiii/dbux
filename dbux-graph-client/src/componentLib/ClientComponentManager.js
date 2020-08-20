import BaseComponentManager from '@dbux/graph-common/src/componentLib/BaseComponentManager';
import componentRegistry from '../_clientRegistry';
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
  
  _deserializeShared(comp, src) {
    if (!src) {
      return;
    }

    try {
      src = JSON.stringify(`comp.shared = ${src}.bind(comp)`);
      // eslint-disable-next-line no-eval
      eval(eval(src));
    } 
    catch (err) {
      // eslint-disable-next-line no-console
      console.error(err); // only show on client; don't send error object back to server
      throw new Error(`could not deserialize 'shared' function -\n${src}\n\n${err.message}`);
    }
  }

  _publicInternal = {
    async createClientComponent(parentId, role, componentId, componentName, shared, initialState) {
      const parent = this.componentManager.getComponent(parentId);

      // NOTE: parent should never be null (except for AppComponent, which does not get initialized this way)

      const ComponentClass = this.componentManager.getComponentClassByName(componentName);

      // NOTE: `_registerComponent` also calls `_build`
      const component = this.componentManager._registerComponent(componentId, parent, ComponentClass, initialState);

      // deserialize shared
      this._deserializeShared(component, shared);

      // preInit
      await component._preInit(initialState);

      // init
      const result = await component._performClientInit(role);

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
    this.app._performClientInit();
  }

  async restart() {
    await this.app.remote.restart();
  }
}

export default ClientComponentManager;