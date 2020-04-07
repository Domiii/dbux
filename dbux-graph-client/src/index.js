import { newLogger, onLogError } from 'dbux-common/src/log/logger';
import ClientComponentManager from './componentLib/ClientComponentManager';

import 'bootstrap/dist/css/bootstrap.css';

import './styles.css';

const { log, debug, warn, error: logError } = newLogger('dbux-graph-client/index');

let componentManager;

onLogError(_handleError);

function _handleError(...args) {
  if (!componentManager?.app?.isInitialized) {
    // error during initialization!
    // go nuclear: display error in DOM
    renderErrorSHUTDOWN(args);
  }
  else {
    // send errors to host
    componentManager.app._remoteInternal.logClientError(args);
  }
}

let isShutdown = false;

function renderErrorSHUTDOWN(args) {
  if (isShutdown) {
    return;
  }

  isShutdown = true;
  document.body.innerHTML = /*html*/`<div>
      <h2>
        ERROR occurred during client initialization
      </h2>
      <pre style="background-color: red;">
        ${args.join(' ')}
      </pre>
    </div>`;
}


window.startDbuxGraphClient = function startDbuxGraphClient(ipcAdapter) {
  componentManager = new ClientComponentManager(ipcAdapter);
  componentManager.start();

  // notify Host that the client is ready
  componentManager.ipc._sendPing();

  return componentManager;
};