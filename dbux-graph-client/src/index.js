import ClientComponentManager from './componentLib/ClientComponentManager';

window.startDbuxGraphClient = function startDbuxGraphClient(ipcAdapter) {
  new ClientComponentManager().start(ipcAdapter);
};