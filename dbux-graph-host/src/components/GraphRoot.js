import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import RunNode from './RunNode';

class GraphRoot extends HostComponentEndpoint {
  addContexts(contexts) {
    const runIds = Array.from(new Set(contexts.map(context => context.runId)));
    runIds.sort((a, b) => b - a);     // sort runIds in ascending order

    // create Run nodes
    this.addChildren(runIds.map(runId => this.children.create(RunNode, { runId })));
  }
}

export default GraphRoot;