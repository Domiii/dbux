import { isControlGroupTimelineNode } from '@dbux/common/src/types/constants/DDGTimelineNodeType';
import { isRoot } from './constants';
import DDGSummaryMode, { isCollapsedMode, isShownMode } from './DDGSummaryMode';
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
   */
  getAllVisibleNodes(ddg) {
    return ddg.timelineNodes.filter(node => !!node && ddgQueries.isVisible(ddg, node));
  },

  /** ###########################################################################
   * Handle summary modes
   * ##########################################################################*/

  /**
   * @param {BaseDDG} ddg 
   */
  canApplyMode(node, mode) {
    // const node = ddg.timelineNodes[timelineId];
    return this._canApplyMode[mode](node);
  },

  _canApplyMode: {
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
      // return Array.isArray(node.children);
      return !isRoot(node.timelineId) && 
        isControlGroupTimelineNode(node.type);
    },
    [DDGSummaryMode.ExpandSelf]: (node) => {
      // return Array.isArray(node.children);
      return isControlGroupTimelineNode(node.type);
    },
    [DDGSummaryMode.ExpandSubgraph]: (node) => {
      // return Array.isArray(node.children);
      return isControlGroupTimelineNode(node.type);
    },
    [DDGSummaryMode.HideChildren]: (node) => {
      // only applies to root (all other nodes are "collapse"d instead)
      return isRoot(node.timelineId);
    }
  }
};

export default ddgQueries;
