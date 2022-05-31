import { isControlGroupTimelineNode } from '@dbux/common/src/types/constants/DDGTimelineNodeType';
import { isRoot } from './constants';
import DDGSummaryMode, { isSummaryMode, isCollapsedMode, isShownMode } from './DDGSummaryMode';
import { DDGTimelineNode } from './DDGTimelineNodes';

/** @typedef { import("./BaseDDG").default } BaseDDG */
/** @typedef { import("./DataDependencyGraph").default } DataDependencyGraph */

class RenderState {
  timelineNodes;

  edges;

  /**
   * @type {Object.<number, SummaryModeValue>}
   */
  summaryModes;
}

/**
 * Queries shared to be used before and after serialization.
 * (Similar to what `dataProviderUtil` is to `RuntimeDataProvider`.)
 */
const ddgQueries = {
  /**
   * @param {RenderState} ddg 
   * @param {RenderState} timelineId
   * @return {DDGTimelineNode}
   */
  getTimelineNode(ddg, timelineId) {
    return ddg.timelineNodes[timelineId];
  },

  /**
   * @param {RenderState} ddg 
   * @param {DDGTimelineNode} node
   */
  isVisible(ddg, node) {
    const summaryMode = ddg.summaryModes[node.timelineId];
    return node.watched || isShownMode(summaryMode);
  },

  /**
   * @param {RenderState} ddg 
   * @param {DDGTimelineNode} node
   */
  isCollapsed(ddg, node) {
    const summaryMode = ddg.summaryModes[node.timelineId];
    return isCollapsedMode(summaryMode);
  },

  /**
   * @param {RenderState} ddg 
   * @param {DDGTimelineNode} node
   */
  isNodeSummarized(ddg, node) {
    const summaryMode = ddg.summaryModes[node.timelineId];
    return isSummaryMode(summaryMode) && !!node.hasRefWriteNodes;
  },

  /**
   * @param {RenderState} ddg 
   */
  getAllVisibleNodes(ddg) {
    return ddg.timelineNodes.filter(node => !!node && ddgQueries.isVisible(ddg, node));
  },

  /**
   * Whether `inner` is descendant of `outer`
   * 
   * @param {RenderState} ddg
   * @param {RefSnapshotTimelineNode} outer
   * @param {RefSnapshotTimelineNode} inner
   */
  isSnapshotDescendant(ddg, outer, inner) {
    const { parentNodeId } = inner;
    if (!parentNodeId) {
      return false;
    }
    const parentNode = this.ddg.timelineNodes[parentNodeId];
    if (parentNode === outer) {
      return true;
    }

    return ddgQueries.isSnapshotDescendant(ddg, outer, parentNode);
  },


  /** ###########################################################################
   * Handle summary modes
   * ##########################################################################*/

  /**
   * @param {BaseDDG} ddg 
   */
  canApplySummaryMode(node, mode) {
    // const node = ddg.timelineNodes[timelineId];
    return this._canApplySummaryMode[mode](node);
  },

  _canApplySummaryMode: {
    [DDGSummaryMode.Show]: (node) => {
      return (
        !!node.dataNodeId && // ← implies that root is excluded
        !node.watched // cannot change state of watched nodes
      );
    },
    [DDGSummaryMode.Hide]: (node) => {
      return (
        !isRoot(node.timelineId) && // cannot hide the root
        !node.watched // cannot change state of watched nodes
      );
    },
    [DDGSummaryMode.Collapse]: (node) => {
      return !isRoot(node.timelineId) &&
        isControlGroupTimelineNode(node.type);
    },
    [DDGSummaryMode.CollapseSummary]: (node) => {
      // TODO: improve this
      return !isRoot(node.timelineId) &&
        isControlGroupTimelineNode(node.type);
    },
    [DDGSummaryMode.ExpandSelf]: (node) => {
      return isControlGroupTimelineNode(node.type);
    },
    [DDGSummaryMode.ExpandSubgraph]: (node) => {
      return isControlGroupTimelineNode(node.type);
    },
    [DDGSummaryMode.HideChildren]: (node) => {
      // only applies to root (all other nodes are "collapse"d instead)
      return isRoot(node.timelineId);
    }
  }
};

export default ddgQueries;
