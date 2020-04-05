import ClientComponentManager from './componentLib/ClientComponentManager';

import 'bootstrap/dist/css/bootstrap.min.css';

window.startDbuxGraphClient = function startDbuxGraphClient(ipcAdapter) {
  new ClientComponentManager().start(ipcAdapter);
};