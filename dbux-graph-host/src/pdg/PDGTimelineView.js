import { pathResolve } from '@dbux/common-node/src/util/pathUtil';
import traceSelection from '@dbux/data/src/traceSelection/index';
import { makeContextLabel } from '@dbux/data/src/helpers/makeLabels';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

/** @typedef { import("@dbux/data/src/pdg/ProgramDependencyGraph").default } ProgramDependencyGraph */
/** @typedef { import("./PDGDocument").default } PDGDocument */

export default class PDGTimelineView extends HostComponentEndpoint {
  /**
   * @type {PDGDocument}
   */
  get doc() {
    return this.context.doc;
  }

  /**
   * @type {ProgramDependencyGraph}
   */
  get pdg() {
    return this.context.doc.pdg;
  }

  get renderState() {
    return this.context.doc.state;
  }

  get mergeComputesMode() {
    return this.renderState.mergeComputesMode;
  }

  init() {
    this.pdg && this.addDisposable(this.pdg.onUpdate(this.#handleGraphUpdate));
  }

  update() {

  }

  // async handleRefresh() {
  //   let trace = traceSelection.selected;
  //   if (trace) {
  //     const { applicationId, contextId } = trace;
  //     const dp = allApplications.getById(applicationId).dataProvider;
  //     // const context = dp.collections.executionContexts.getById(contextId);
  //     const pdgArgs = { applicationId, contextId };
  //     const failureReason = dp.pdgs.getCreatePDGFailureReason(pdgArgs);
  //     if (failureReason) {
  //       this.setFailure(failureReason);
  //     }
  //     else {
  //       const pdg = dp.pdgs.getOrCreatePDGForContext(pdgArgs);
  //       this.setGraph(pdg);
  //     }
  //   }
  //   else {
  //     const failureReason = 'PDG is empty';
  //     this.setFailure(failureReason);
  //   }
  // }

  // setGraph(pdg) {
  //   this.pdg = pdg;

  //   // reset status message
  //   const failureReason = null;
  //   const { applicationId } = pdg.dp.application;

  //   this.setState({ failureReason, applicationId, ...pdg.getRenderData() });
  // }

  // setFailure(failureReason) {
  //   // reset graph
  //   this.setState({ failureReason, timelineNodes: EmptyArray, edges: EmptyArray });
  // }

  shared() {
    return {
      context: {
        view: this
      }
    };
  }


  #handleGraphUpdate = async (pdg) => {
    // send update to remote
    this.doc.setState(pdg.getRenderData());
  }

  /** ###########################################################################
   * public
   * ##########################################################################*/

  _public = {
    /**
     * HACKFIX: we do this, so we can resolve `pdg` in here.
     *    → That is necessary b/c VSCode won't resolve the nesting class's prop.
     * @type {ProgramDependencyGraph}
     */
    get pdg() { return null; },

    selectNode(timelineId) {
      const { timelineNodes } = this.renderState;
      const node = timelineNodes[timelineId];
      if (node.dataNodeId) {
        let traceId;
        const { dp } = this.pdg;
        if (node.isPartial) {
          traceId = this.pdg.getPartialSnapshotTraceId(node);
        }
        else {
          const dataNode = dp.collections.dataNodes.getById(node.dataNodeId);
          traceId = dataNode.traceId;
        }
        const trace = dp.collections.traces.getById(traceId);
        if (trace) {
          traceSelection.selectTrace(trace, null, node.dataNodeId);
        }
      }
    },

    async toggleSummaryMode(cfg) {
      this.pdg.toggleSummaryMode(cfg.timelineId);
    },

    /**
     * Handle update graph request from client
     */
    async updateGraph(cfg) {
      const {
        timelineId, summaryMode, settings
      } = cfg;
      const { pdg } = this;

      if (settings) {
        pdg.updateSettings(settings);
      }
      if (summaryMode) {
        // update graph
        pdg.setSummaryMode(timelineId, summaryMode);
      }
    },
    async saveScreenshot(svgString) {
      const { dp, contextId } = this.pdg;
      const context = dp.collections.executionContexts.getById(contextId);
      const { application } = dp;
      const name = makeContextLabel(context, application);
      const fname = `${name}_${contextId}`;
      await this.componentManager.externals.saveFile(fname, svgString);
    }
  };
  get public() {
    return this._public;
  }
  set public(value) {
    this._public = value;
  }
}
