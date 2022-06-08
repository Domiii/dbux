import BaseComponentManager from '@dbux/graph-common/src/componentLib/BaseComponentManager';
import { onLogError } from '@dbux/common/src/log/logger';
import ClientComponentEndpoint from './ClientComponentEndpoint';
import initLang from '../lang';

// import shared styles
import '../styles.css';

const EndpointName = 'Client';

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
      // TODO: make sure, `comp` variable name never gets mangled, even in production
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
    async createClientComponent(parentId, role, componentId, componentName, shared, initialState, clientAdditionalProps) {
      const parent = this.componentManager.getComponent(parentId);

      // NOTE: parent should never be null (except for AppComponent, which does not get initialized this way)

      const ComponentClass = this.componentManager.getComponentClassByName(componentName);

      if (!ComponentClass) {
        throw new Error(`Component class not registered on client: ${componentName}`);
      }

      // NOTE: `_registerComponent` also calls `_build`
      /**
       * @type {ClientComponentEndpoint}
       */
      const component = this.componentManager._registerComponent(componentId, parent, ComponentClass, initialState, clientAdditionalProps);

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
  /**
   * singleton
   */
  static instance;

  constructor(componentRegistry, ipcAdapter) {
    // add hard-coded AppComponent
    componentRegistry.AppComponent = AppComponent;
    super(componentRegistry, ipcAdapter);
    
    ClientComponentManager.instance = this;
  }

  get endpointName() {
    return EndpointName;
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


// ###########################################################################
// some error handling
// ###########################################################################

onLogError(_handleError);
window.addEventListener('uncaughtexception', _handleError);

function _handleError(...args) {
  if (!ClientComponentManager.instance?.app?.isInitialized) {
    // error during initialization!
    // go nuclear: display error in DOM
    renderErrorSHUTDOWN(args);
  }
  else {
    // send errors to host
    ClientComponentManager.instance.app._remoteInternal.logClientError(args);
  }
}

let isShutdown = false;

function renderErrorSHUTDOWN(args) {
  if (isShutdown) {
    return;
  }

  isShutdown = true;
  document.body.innerHTML = /*html*/`<div style="background-color: red;">
      <h2>
        ERROR occurred during client initialization
      </h2>
      <pre>
        ${args.join(' ')}
      </pre>
    </div>`;
}


// ###########################################################################
// init
// ###########################################################################


// eslint-disable-next-line no-unused-vars
// const { log, debug, warn, error: logError } = newLogger('dbux-graph-client/index');

let componentManager;

// window._graphInstance = 0;

export async function startDbuxComponents(componentRegistry, ipcAdapter) {
  await initLang('zh');
  // console.log('Client started', ++window._graphInstance);

  // const r = Math.random();
  // setInterval(() => {
  //   console.log('Client alive', r);
  // }, 500);

  componentManager = new ClientComponentManager(componentRegistry, ipcAdapter);
  componentManager.start();

  // NOTE: "ping" actually means "clientReady"
  // TODO: rename sendPing
  componentManager.ipc._sendPing();

  return componentManager;
}