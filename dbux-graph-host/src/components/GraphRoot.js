import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import RunNode from './RunNode';

class GraphRoot extends HostComponentEndpoint {
  addContexts(applicationId, contexts) {
    const runIds = Array.from(new Set(contexts.map(context => context.runId)));
    runIds.sort((a, b) => b - a);     // sort runIds in ascending order

    // create Run nodes
    runIds.forEach(runId =>
      this.children.createComponent(RunNode, { applicationId, runId })
    );
  }
}

export default GraphRoot;