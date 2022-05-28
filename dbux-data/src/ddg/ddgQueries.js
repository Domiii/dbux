import { isControlGroupTimelineNode } from '@dbux/common/src/types/constants/DDGTimelineNodeType';
import { isRoot } from './constants';
import DDGSummaryMode from './DDGSummaryMode';

/** @typedef { import("./BaseDDG").default } BaseDDG */
/** @typedef { import("./DataDependencyGraph").default } DataDependencyGraph */

/**
 * Queries shared to be used before and after serialization.
 * (Similar to what `dataProviderUtil` is to `RuntimeDataProvider`.)
 */
const ddgQueries = {

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
