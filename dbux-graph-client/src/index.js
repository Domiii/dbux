import GraphClient from './GraphClient';

const { ipcAdapter } = window;
const graph = new GraphClient();

graph.startIpc(ipcAdapter);

window.graph = graph;