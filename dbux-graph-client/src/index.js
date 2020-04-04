import GraphClient from './GraphClient';

export function start() {
  const { ipcAdapter } = window;
  componentManager.addComponent(GraphClient);

  graph.startIpc(ipcAdapter);

  window.graph = graph;
}