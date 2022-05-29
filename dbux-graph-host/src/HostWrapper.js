import { newLogger } from '@dbux/common/src/log/logger';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import HostComponentManager from './componentLib/HostComponentManager';


/**
 * Wrapper for the host of a web application split into host and client, using components.
 * future-work: rename `dbux-graph-host` and `dbux-graph-client` to `dbux-web-host` and `dbux-web-client`, respectively.
 */
export default class HostWrapper {
  _onStart;
  _restart;
  _componentManagerArgs;

  /**
   * @type {HostComponentManager}
   */
  componentManager;

  constructor(name, components, MainComponent) {
    this.name = name;
    this.logger = newLogger(`${name} HostWrapper`);
    this.MainComponent = MainComponent;
    this.components = components;
  }

  reset() {
    if (this.componentManager) {
      this.componentManager.silentShutdown();
    }
    this.componentManager = new HostComponentManager(...(this._componentManagerArgs || EmptyArray), this.components);
    this.componentManager.handlePing = this.pairingCompleted;
  }

  pairingCompleted = () => {
    // client is ready!
    if (this.componentManager.hasStarted()) {
      // host was already running -> meaning we need to restart the whole thing
      this.logger.debug('was restarted from outside. - Restarting everything...');
      // client got restarted without the host telling it to -> ignore this start, and force another restart instead
      // reset();
      // setTimeout(_restart, 300);   // delaying things seems to make it worse
      this._restart();
      return;
    }

    this.logger.debug('client connected. - Starting host...');

    // start
    this.componentManager.start();

    // build component tree
    /* const doc = */
    this.componentManager.app.children.createComponent(this.MainComponent, this._makeInitialState?.(), this._makeHostOnlyState?.());

    // notify starter (e.g. code/GraphWebView)
    this._onStart(this.componentManager);
  }

  // ###########################################################################
  // public methods
  // ###########################################################################

  /**
   * Start the dbux-graph-host.
   * Starts listening for app events and rendering to the user.
   */
  startGraphHost(makeInitialState, makeHostOnlyState, onStart, restart, ...args) {
    this._componentManagerArgs = args;
    this._makeInitialState = makeInitialState;
    this._makeHostOnlyState = makeHostOnlyState;
    this._onStart = onStart;
    this._restart = restart;

    this.reset();
  }

  shutdownGraphHost() {
    if (this.componentManager) {
      this.componentManager.silentShutdown();

      // clear closed componentManager
      this.componentManager = null;
    }
  }
}