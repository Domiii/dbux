import ComponentEndpoint from 'dbux-graph-common/src/componentLib/ComponentEndpoint';
import { newLogger } from 'dbux-common/src/log/logger';
import HostComponentList from './HostComponentList';

const { log, debug, warn, error: logError } = newLogger('dbux-graph-host/HostComponentEndpoint');

/**
 * The Host endpoint controls the Client endpoint.
 */
class HostComponentEndpoint extends ComponentEndpoint {
  /**
   * @type {HostComponentList}
   */
  children;
  isInitialized = false;

  _initPromise;


  constructor() {
    super();

    this.children = new HostComponentList(this);
  }

  get isInitializing() {
    return !!this._initPromise;
  }

  setState(update) {
    // TODO: update own state
    // TODO: send to remote
  }

  // ###########################################################################
  // init
  // ###########################################################################

  _doInit(parent, componentId, ipc, initialState) {
    super._doInit(parent, componentId, ipc, initialState);

    // NOTE: this is called by `BaseComponentManager._initComponent`
    // TODO: fix this up

    this._initPromise = manager.remote['_internal.initComponent']({
      
    }).then(
      () => {
        // success
        this.isInitialized = true;
        this._initPromise = null;
      },
      (err) => {
        // error
        this._initPromise = null;
        logError('failed to initialize client - error occured (probably on client)\n  ', err);
      }
    );
  }

  waitForInit() {
    return this._initPromise;
  }

  // ###########################################################################
  // removing + disposing
  // ###########################################################################

  /**
   * Remove from parent.
   */
  remove() {
    this.parent.children._removeComponent(this);

    // TODO: send to remote
  }

  /**
   * First disposes all descendants (removes recursively) and then removes itself.
   */
  dispose() {
    for (const child of this.children) {
      child.dispose();
    }

    this.remove();
  }

  // ###########################################################################
  // static
  // ###########################################################################
}

export default HostComponentEndpoint;