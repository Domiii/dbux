import EmptyArray from '@dbux/common/src/util/EmptyArray';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection/index';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

/** @typedef { import("@dbux/data/src/ddg/DataDependencyGraph").default } DataDependencyGraph */
/** @typedef { import("./DDGDocument").default } DDGDocument */

export default class DDGTimelineView extends HostComponentEndpoint {
  /**
   * @type {DDGDocument}
   */
  get doc() {
    return this.context.doc;
  }

  /**
   * @type {DataDependencyGraph}
   */
  get ddg() {
    return this.context.doc.ddg;
  }

  get mergeComputesMode() {
    return this.doc.state.mergeComputesMode;
  }

  init() {
    this.addDisposable(
      this.doc.onMergeComputesModeChanged(this.handleMergeComputesModeChanged)
    );
  }

  update() {

  }

  // async handleRefresh() {
  //   let trace = traceSelection.selected;
  //   if (trace) {
  //     const { applicationId, contextId } = trace;
  //     const dp = allApplications.getById(applicationId).dataProvider;
  //     // const context = dp.collections.executionContexts.getById(contextId);
  //     const ddgArgs = { applicationId, contextId };
  //     const failureReason = dp.ddgs.getCreateDDGFailureReason(ddgArgs);
  //     if (failureReason) {
  //       this.setFailure(failureReason);
  //     }
  //     else {
  //       const ddg = dp.ddgs.getOrCreateDDGForContext(ddgArgs);
  //       this.setGraph(ddg);
  //     }
  //   }
  //   else {
  //     const failureReason = 'DDG is empty';
  //     this.setFailure(failureReason);
  //   }
  // }

  // setGraph(ddg) {
  //   this.ddg = ddg;

  //   // reset status message
  //   const failureReason = null;
  //   const { applicationId } = ddg.dp.application;

  //   this.setState({ failureReason, applicationId, ...ddg.getRenderData() });
  // }

  // setFailure(failureReason) {
  //   // reset graph
  //   this.setState({ failureReason, timelineNodes: EmptyArray, edges: EmptyArray });
  // }

  handleMergeComputesModeChanged = () => {
    this.ddg?.setMergeComputes(this.mergeComputesMode);
  };

  shared() {
    return {
      context: {
        view: this
      }
    };
  }

  public = {
    selectNode(timelineId) {
      const node = this.state.timelineNodes[timelineId];
      if (node.dataNodeId) {
        const { applicationId } = this.state;
        const dp = allApplications.getById(applicationId).dataProvider;
        const dataNode = dp.collections.dataNodes.getById(node.dataNodeId);
        const trace = dp.collections.traces.getById(dataNode.traceId);
        if (trace) {
          traceSelection.selectTrace(trace, null, node.dataNodeId);
        }
      }
    },

    setSummaryMode(timelineId, mode) {
      this.ddg?.setSummaryMode(timelineId, mode);

      // TODO: call setState
      this.doc.setState();
    }
  }
}
