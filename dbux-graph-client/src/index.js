import GraphClient from './GraphClient';

const { ipcAdapter } = window;
componentManager.addComponent(GraphClient);

graph.startIpc(ipcAdapter);

window.graph = graph;