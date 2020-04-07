import { newLogger } from 'dbux-common/src/log/logger';
import GraphDocument from './components/GraphDocument';
import HostComponentManager from './componentLib/HostComponentManager';

const { log, debug, warn, error: logError } = newLogger('dbux-graph-host/HostComponentManager');

let _ipcAdapter, _onStart;
let componentManager, doc;

function reset() {
  componentManager = new HostComponentManager(_ipcAdapter);
  componentManager.handlePing = pairingCompleted;
}

function pairingCompleted() {
  // client is ready!
  debug('dbux-graph-client connected. - Starting host...');

  if (componentManager.hasStarted()) {
    reset();
  }

  // start
  componentManager.start();

  // build component tree
  doc = componentManager.app.children.createComponent(GraphDocument);

  // notify caller
  _onStart(componentManager);
}

/**
 * Start the dbux-graph-host.
 * Starts listening for app events and rendering to the user.
 */
export function startGraphHost(ipcAdapter, onStart) {
  _ipcAdapter = ipcAdapter;
  _onStart = onStart;

  reset();
}