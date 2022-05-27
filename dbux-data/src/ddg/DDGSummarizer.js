
/** @typedef { import("./DataDependencyGraph").default } DataDependencyGraph */

import { isControlGroupTimelineNode } from '@dbux/common/src/types/constants/DDGTimelineNodeType';
import { RootTimelineId } from './constants';
import DDGSummaryMode from './DDGSummaryMode';

/** ###########################################################################
 * utilities
 *  #########################################################################*/


/** ###########################################################################
 * {@link DDGSummarizer}
 *  #########################################################################*/

export default class DDGSummarizer {
  /**
   * @type {DataDependencyGraph}
   */
  ddg;

  summaryModes = {};

  constructor(ddg) {
    this.ddg = ddg;
  }

  canApplyMode = {
    [DDGSummaryMode.Hide]: (timelineId) => {
      const { ddg } = this;
      // const node = ddg.timelineNodes[timelineId];
      return timelineId !== RootTimelineId && // NOTE: we cannot hide the root
        (
          // !doesTimelineNodeHaveData(node.type) ||
          node.dataNodeId ||
          !ddg.watchSet.isWatchedDataNode(node.dataNodeId)
        );
    },
    [DDGSummaryMode.Collapse]: (timelineId) => {
      const { ddg } = this;
      const node = ddg.timelineNodes[timelineId];
      // return Array.isArray(node.children);
      return isControlGroupTimelineNode(node.type);
    },
    [DDGSummaryMode.ExpandSelf]: (timelineId) => {
      const { ddg } = this;
      const node = ddg.timelineNodes[timelineId];
      // return Array.isArray(node.children);
      return isControlGroupTimelineNode(node.type);
    },
    [DDGSummaryMode.ExpandSubgraph]: (timelineId) => {
      const { ddg } = this;
      const node = ddg.timelineNodes[timelineId];
      // return Array.isArray(node.children);
      return isControlGroupTimelineNode(node.type);
    },
    [DDGSummaryMode.HideChildren]: (timelineId) => {
      // only applies to root (all other nodes are "collapse"d instead)
      return timelineId === RootTimelineId;
    }
  };

  applyModeHandlers = {
    [DDGSummaryMode.Hide]: (timelineId) => {
      const { ddg } = this;
      const node = ddg.timelineNodes[timelineId];

      // hide all children
      for (const childId of node.children) {
        // const childNode = ddg.timelineNodes[childId];
        this.applyMode(childId, DDGSummaryMode.Hide);
      }

      this.updateNodeState(timelineId, NodeState.Hidden);
      // TODO: update edges
    },
    [DDGSummaryMode.Collapse]: (timelineId) => {
      const { ddg } = this;
      const node = ddg.timelineNodes[timelineId];

      // hide all children
      for (const childId of node.children) {
        // const childNode = ddg.timelineNodes[childId];
        this.applyMode(childId, DDGSummaryMode.Hide);
      }

      this.updateNodeState(timelineId, NodeState.Collapsed);
      // TODO: update edges
    },
    [DDGSummaryMode.ExpandSelf]: (timelineId) => {
      const { ddg } = this;
      const node = ddg.timelineNodes[timelineId];

      // collapse all children
      for (const childId of node.children) {
        // const childNode = ddg.timelineNodes[childId];
        this.applyMode(childId, DDGSummaryMode.Collapse);
      }

      this.updateNodeState(timelineId, NodeState.Expanded);
      // TODO: update edges
    },
    [DDGSummaryMode.ExpandSubgraph]: (timelineId) => {
      const { ddg } = this;
      const node = ddg.timelineNodes[timelineId];

      // expand all children and their children
      for (const childId of node.children) {
        // const childNode = ddg.timelineNodes[childId];
        this.applyMode(childId, DDGSummaryMode.ExpandSubgraph);
      }

      this.updateNodeState(timelineId, NodeState.Expanded);
      // TODO: update edges
    },
    [DDGSummaryMode.HideChildren]: (timelineId) => {
      const { ddg } = this;
      const node = ddg.timelineNodes[timelineId];

      // hide all children
      for (const childId of node.children) {
        this.applyMode(childId, DDGSummaryMode.Hide);
      }

      // TODO: updateEdges()
    }
  };

  updateNodeState(timelineId, nodeState) {
    // TODO: change node repsentation to (1) hidden, (2) collapsed or (3) expanded node
    // TODO: in order to apply incremental changes, keep track of `Hidden` (i.e. removed) nodes
  }

  updateEdges() {
    // TODO
  }

  applyMode(timelineId, mode) {
    if (this.canApplyMode[mode](timelineId)) {
      // TODO:
      // 0. add `edgeId` to edges; fix corresponding edge containers; remove `timelineDataNodes` container etc.
      // 1. determine: Add or Cull
      // 2. [nodeSet, edgeSet] = gatherNodesAndEdges (to be added or culled)
      //    * if cull:
      //      * also track replaceByNodes
      //    * if add:
      //      * get nodes and edges back from `this.hiddenNodes`, `this.hiddenEdges`
      // 3. updateNodes:
      //    * update ddg.timelineNodes (etc.): cull (remove or merge (update)) or bring back nodes
      //    * update `this.hiddenNodes` set
      // 4. updateEdges: 
      //    * if cull:
      //      * if from + to both in `nodeSet`: move to `this.hiddenEdges`
      //      * else if from or to in `nodeSet`: update edge
      //    * TODO: handle duplicate edges (e.g. store some `this.duplicateEdgesById` which tells us where they are)
      this.applyModeHandlers[mode](timelineId);
    }
  }

  setSummaryMode(timelineId, mode) {
    this.summaryModes[timelineId] = mode;
    this.applyMode(timelineId, mode);
  }
}
