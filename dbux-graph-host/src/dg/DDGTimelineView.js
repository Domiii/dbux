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
      const ddgArgs = { contextId };
      const failureReason = dp.ddgs.getCreateDDGFailureReason(ddgArgs);
      if (failureReason) {
        this.setState({ failureReason, nodes: EmptyArray, edges: EmptyArray });
      }
      else {
        const ddg = dp.ddgs.getOrCreateDDGForContext(ddgArgs);
        const { nodes, edges } = ddg;
        this.setState({ nodes, edges });
      }
    }
    else {
      this.setState({ nodes: EmptyArray, edges: EmptyArray });
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
