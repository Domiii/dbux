import { newLogger } from '@dbux/common/src/log/logger';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import GraphDocument from './components/GraphDocument';
import HostComponentManager from './componentLib/HostComponentManager';
import componentRegistry from './_hostRegistry';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('dbux-graph-host/HostComponentManager');

let _onStart, _restart, _args;

/**
 * @type {HostComponentManager}
 */
let componentManager;

function reset() {
  if (componentManager) {
    componentManager.silentShutdown();
  }
  componentManager = new HostComponentManager(...(_args || EmptyArray), componentRegistry);
  componentManager.handlePing = pairingCompleted;
}

function pairingCompleted() {
  // client is ready!
  if (componentManager.hasStarted()) {
    // host was already running -> meaning we need to restart the whole thing
    debug('dbux-graph-client was restarted from outside. - Restarting everything...');
    // client got restarted without the host telling it to -> ignore this start, and force another restart instead
    // reset();
    // setTimeout(_restart, 300);   // delaying things seems to make it worse
    _restart();
    return;
  }

  debug('dbux-graph-client connected. - Starting host...');

  // start
  componentManager.start();

  // build component tree
  /* const doc = */ componentManager.app.children.createComponent(GraphDocument);

  // notify starter (e.g. code/GraphWebView)
  _onStart(componentManager);
}

/**
 * Start the dbux-graph-host.
 * Starts listening for app events and rendering to the user.
 */
export function startGraphHost(onStart, restart, ...args) {
  _args = args;
  _onStart = onStart;
  _restart = restart;

  reset();
}

export function shutdownGraphHost() {
  if (componentManager) {
    componentManager.silentShutdown();
    
    // clear closed componentManager
    componentManager = null;
  }
}