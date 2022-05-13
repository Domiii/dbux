import EmptyArray from '@dbux/common/src/util/EmptyArray';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection/index';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

export default class DDGTimelineView extends HostComponentEndpoint {
  init() {
    this.state.nodes = EmptyArray;
    this.state.edges = EmptyArray;
  }

  update() {

  }

  handleRefresh() {
    const trace = traceSelection.selected;
    if (trace) {
      const { applicationId, contextId } = trace;
      const dp = allApplications.getById(applicationId).dataProvider;
      // const context = dp.collections.executionContexts.getById(contextId);
      const ddg = dp.getOrCreateDDGForContext(contextId);
      const { nodes, edges } = ddg.timeline;
      this.setState({ nodes, edges });
    }
    else {
      this.setState({ nodes: EmptyArray, edges: [EmptyArray] });
    }
  }

  shared() {
    return {
      context: {
        view: this
      }
    };
  }
}
