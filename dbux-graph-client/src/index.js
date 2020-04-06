import { newLogger } from 'dbux-common/src/log/logger';
import ClientComponentManager from './componentLib/ClientComponentManager';

import 'bootstrap/dist/css/bootstrap.css';

const { log, debug, warn, error: logError } = newLogger('dbux-graph-host/HostComponentManager');

window.startDbuxGraphClient = function startDbuxGraphClient(ipcAdapter) {
  const manager = new ClientComponentManager(ipcAdapter);
  manager.start();

  // notify Host that the client is ready
  manager.ipc._sendPing();

  return manager;
};