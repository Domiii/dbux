import GraphDocument from './components/GraphDocument';
import HostComponentManager from './componentLib/HostComponentManager';

let componentManager, doc;

/**
 * Start the dbux-graph-host.
 * Starts listening for app events and rendering to the user.
 */
export function startGraphHost(ipcAdapter) {
  // TODO: should this also be given the controls to start the client?

  componentManager = new HostComponentManager();
  componentManager.start(ipcAdapter);
  
  doc = componentManager.addComponent(GraphDocument);

  return componentManager;
}