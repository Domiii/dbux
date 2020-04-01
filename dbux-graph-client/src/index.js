import GraphClient from './GraphClient';
import ClientCommands from './ClientCommands';

const { ipcAdapter } = window;
const graph = new GraphClient();
const commands = new ClientCommands(graph);

graph.startIpc(ipcAdapter, commands);

window.graph = graph;