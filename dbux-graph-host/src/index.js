import GraphDocument from './components/GraphDocument';
import HostComponentManager from './componentLib/HostComponentManager';

let doc;

/**
 * Start the dbux-graph-host.
 * Starts listening for app events and rendering to the user.
 */
export function start(ipcAdapter) {
  // TODO: should this also be given the controls to start the client?

  HostComponentManager.create(ipcAdapter);
  doc = HostComponentManager.instance.addComponent(GraphDocument);
}