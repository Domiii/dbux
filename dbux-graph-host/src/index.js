import GraphDocument from './components/GraphDocument';

let doc;

/**
 * Start the dbux-graph-host.
 * Starts listening for app events and rendering to the user.
 */
export function start() {
  // TODO: should this also be given the controls to start the client?
  doc = GraphDocument.create();
}