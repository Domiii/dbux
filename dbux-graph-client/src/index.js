import { newLogger, onLogError } from '@dbux/common/src/log/logger';
import ClientComponentManager from './componentLib/ClientComponentManager';

import 'bootstrap/dist/css/bootstrap.css';

import './styles.css';

// eslint-disable-next-line no-unused-vars
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

// window._graphInstance = 0;

window.startDbuxGraphClient = function startDbuxGraphClient(ipcAdapter) {
  // console.log('Client started', ++window._graphInstance);

  // const r = Math.random();
  // setInterval(() => {
  //   console.log('Client alive', r);
  // }, 500);

  componentManager = new ClientComponentManager(ipcAdapter);
  componentManager.start();

  // NOTE: "ping" actually means "clientReady"
  // TODO: rename sendPing
  componentManager.ipc._sendPing();

  return componentManager;
};