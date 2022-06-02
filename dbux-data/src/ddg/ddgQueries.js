import EmptyArray from '@dbux/common/src/util/EmptyArray';
import DDGTimelineNodeType, { isControlGroupTimelineNode } from '@dbux/common/src/types/constants/DDGTimelineNodeType';
import { isRoot } from './constants';
import DDGSummaryMode, { isSummaryMode, isCollapsedMode, isShownMode } from './DDGSummaryMode';
import { DDGTimelineNode } from './DDGTimelineNodes';
import DDGNodeSummary from './DDGNodeSummary';

/** @typedef { import("./BaseDDG").default } BaseDDG */
/** @typedef { import("./DataDependencyGraph").default } DataDependencyGraph */

export class RenderState {
  /**
   * @type {Array.<DDGTimelineNode>}
   */
  timelineNodes;

  /**
   * @type {DDGEdge[]}
   */
  edges;

  /**
   * Maps `timelineId` to array of `edgeId`.
   * @type {Object.<number, number[]>}
   */
  outEdgesByTimelineId;

  /**
   * Maps `timelineId` to array of `edgeId`.
   * @type {Object.<number, number[]>}
   */
  inEdgesByTimelineId;

  /**
   * @type {Object.<number, SummaryModeValue>}
   */
  summaryModes;

  /**
   * Summary data by `timelineId`.
   * NOTE: This is built lazily in `buildNodeSummary`, and not available until a Node has been explicitly summarized.
   * 
   * @type {Object.<number, DDGNodeSummary>}
   */
  nodeSummaries;
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
  isNodeConnected(ddg, node) {
    // NOTE: collapsed group nodes don't have `connected` set
    return node.connected || (
      isControlGroupTimelineNode(node.type) && ddg.outEdgesByTimelineId[node.timelineId]
    );
  },

  /**
   * @param {RenderState} ddg 
   * @param {DDGTimelineNode} node
   */
  isVisible(ddg, node) {
    const summaryMode = ddg.summaryModes[node.timelineId];
    return node.watched || (isShownMode(summaryMode) && ddgQueries.isNodeConnected(ddg, node));
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
  isExpandedGroupNode(ddg, node) {
    return isControlGroupTimelineNode(node.type) && !ddgQueries.isCollapsed(ddg, node);
  },

  /**
   * @param {RenderState} ddg 
   * @param {DDGTimelineNode} node
   */
  isSnapshot(ddg, node) {
    return node.type === DDGTimelineNodeType.RefSnapshot;
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
   * @param {DDGTimelineNode} node
   */
  getVisibleSummary(ddg, node) {
    const isSummarized = ddgQueries.isNodeSummarized(ddg, node);
    if (isSummarized) {
      return ddg.nodeSummaries[node.timelineId];
    }
    return null;
  },

  /**
   * Returns summary roots.
   * 
   * @param {RenderState} ddg 
   * @param {DDGNodeSummary} summary
   */
  getSummaryRoots(ddg, summary) {
    const rootIds = summary.summaryRoots;
    return rootIds.map(id => ddg.timelineNodes[id]);
  },

  /**
   * Returns *all* snapshots in summary.
   * 
   * @param {RenderState} ddg 
   * @param {DDGNodeSummary} summary
   */
  getSummarySnapshots(ddg, summary) {
    const summaryNodeIds = Array.from(summary.snapshotsByRefId.values());
    return summaryNodeIds.map(id => ddg.timelineNodes[id]);
  },

  /**
   * NOTE: this excludes ValueNodes nodes inside of summary snapshots.
   * 
   * @param {RenderState} ddg 
   */
  getAllVisibleNodes(ddg) {
    return ddg.timelineNodes
      // filter visible
      .filter(node => !!node && ddgQueries.isVisible(ddg, node))
      // add summary nodes
      .flatMap(node => {
        const summary = ddgQueries.getVisibleSummary(ddg, node);
        if (summary) {
          return [node, ...ddgQueries.getSummarySnapshots(ddg, summary)];
        }
        return node;
      });
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
    const parentNode = ddg.timelineNodes[parentNodeId];
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
    [DDGSummaryMode.SummarizeChildren]: (node) => {
      return isControlGroupTimelineNode(node.type);
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
