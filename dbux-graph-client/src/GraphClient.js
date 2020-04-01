import GraphBase from 'dbux-graph-common/src/GraphBase';
import ClientCommands from './ClientCommands';

class GraphClient extends GraphBase {
  constructor() {
    super();

    this.commands = new ClientCommands(this);
  }
}

export default GraphClient;