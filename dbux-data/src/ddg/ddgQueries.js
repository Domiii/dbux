import PDGTimelineNodeType, { isControlGroupTimelineNode } from '@dbux/common/src/types/constants/PDGTimelineNodeType';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import { isPDGRoot } from './constants';
import PDGSummaryMode, { isSummaryMode, isCollapsedMode, isShownMode, isExpandedMode } from './PDGSummaryMode';
import { PDGTimelineNode } from './PDGTimelineNodes';
import PDGNodeSummary from './PDGNodeSummary';
import PDGSettings from './PDGSettings';

/** @typedef { import("./BasePDG").default } BasePDG */
/** @typedef { import("./DataDependencyGraph").default } DataDependencyGraph */

export class RenderState {
  /**
   * @type {Array.<PDGTimelineNode>}
   */
  timelineNodes;

  /**
   * @type {PDGEdge[]}
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
   * @type {Object.<number, PDGNodeSummary>}
   */
  nodeSummaries;

  /**
   * @type {PDGSettings}
   */
  settings;
}

/** ###########################################################################
 * {@link _canApplySummaryMode}
 * ##########################################################################*/

const _canApplySummaryMode = {
  [PDGSummaryMode.Show]: (pdg, node) => {
    return (
      !!node.dataNodeId && // ← implies that root is excluded
      !node.watched // cannot change state of watched nodes
    );
  },
  [PDGSummaryMode.Hide]: (pdg, node) => {
    return (
      !isPDGRoot(node.timelineId) && // cannot hide the root
      !node.watched // cannot change state of watched nodes
    );
  },
  /**
   * 
   * @param {PDGTimelineNode} node 
   */
  [PDGSummaryMode.CollapseSummary]: (pdg, node) => {
    // TODO: improve this
    // eslint-disable-next-line no-use-before-define
    return pdgQueries.isNodeSummarizable(pdg, node);
  },
  [PDGSummaryMode.ExpandSelf]: (pdg, node) => {
    return isControlGroupTimelineNode(node.type) && !!node.children.length;
  },
  [PDGSummaryMode.ExpandSelf1]: (pdg, node) => {
    return isControlGroupTimelineNode(node.type) && !!node.children.length;
  },
  [PDGSummaryMode.ExpandSelf2]: (pdg, node) => {
    return isControlGroupTimelineNode(node.type) && !!node.children.length;
  },
  [PDGSummaryMode.ExpandSelf3]: (pdg, node) => {
    return isControlGroupTimelineNode(node.type) && !!node.children.length;
  },
  [PDGSummaryMode.ExpandSelf4]: (pdg, node) => {
    return isControlGroupTimelineNode(node.type) && !!node.children.length;
  },
  [PDGSummaryMode.ExpandSubgraph]: (pdg, node) => {
    return isControlGroupTimelineNode(node.type) && !!node.children.length;
  },
  [PDGSummaryMode.HideChildren]: (pdg, node) => {
    // only applies to root (all other nodes are "collapse"d instead)
    return isPDGRoot(node.timelineId) || node.watched;
  }
};

/** ###########################################################################
 * {@link pdgQueries}
 * ##########################################################################*/

/**
 * Queries shared to be used before and after serialization.
 * (Similar to what `dataProviderUtil` is to `RuntimeDataProvider`.)
 */
const pdgQueries = {
  /**
   * @param {RenderState} pdg 
   * @param {RenderState} timelineId
   * @return {PDGTimelineNode}
   */
  getTimelineNode(pdg, timelineId) {
    return pdg.timelineNodes[timelineId];
  },

  /**
   * @param {RenderState} pdg 
   * @param {PDGTimelineNode} node
   */
  getNodeSummaryMode(pdg, node) {
    return pdg.summaryModes[node.timelineId];
  },

  /**
   * WARNING: This does not work on summary nodes (would need to check !node.og as well).
   * 
   * @param {RenderState} pdg 
   * @param {PDGTimelineNode} node
   */
  isNodeConnected(pdg, node) {
    // NOTE: group nodes generally don't have edges
    return node.connected || (
      isControlGroupTimelineNode(node.type)
    );
  },

  /**
   * Check node connected-ness against connected setting.
   * 
   * @param {RenderState} pdg 
   * @param {PDGTimelineNode} node
   */
  checkConnected(pdg, node) {
    return (
      // connected only
      (pdg.settings.connectedOnly && pdgQueries.isNodeConnected(pdg, node)) ||

      // even if not connected, node must have at least one edge
      // TODO: client has no access to og, and summarization checks this before edges are built
      (!pdg.settings.connectedOnly /* && (
        !!pdg.og.inEdgesByTimelineId[node.timelineId]?.length ||
        !!pdg.og.outEdgesByTimelineId[node.timelineId]?.length
      ) */)
    );
  },

  /**
   * Check node param status against param setting.
   * 
   * @param {PDGTimelineNode} node
   */
  checkParams(pdg, node) {
    return pdg.settings.params || !TraceType.is.Param(node.traceType);
  },

  /**
   * Check settings against node status.
   * 
   * @param {RenderState} pdg 
   * @param {PDGTimelineNode} node
   */
  checkNodeVisibilitySettings(pdg, node) {
    return node.watched ||  // don't hide watched nodes
      (
        pdgQueries.checkConnected(pdg, node) &&
        pdgQueries.checkParams(pdg, node)
      );
  },


  /**
   * @param {RenderState} pdg 
   * @param {PDGTimelineNode} node
   */
  isVisible(pdg, node) {
    return node.watched || (
      // check summary status
      (
        // summarized nodes don't have a summary status
        !node.og ||
        (
          // og node must be shown
          isShownMode(pdg.summaryModes[node.timelineId]) &&
          // and summarized og group nodes must have a non-empty summary
          (!pdgQueries.isNodeSummarizedMode(pdg, node) || pdgQueries.doesNodeHaveSummary(pdg, node))
        )
      ) &&
      pdgQueries.checkNodeVisibilitySettings(pdg, node)
    );
  },

  /**
   * @param {RenderState} pdg 
   * @param {PDGTimelineNode} node
   */
  isCollapsed(pdg, node) {
    const summaryMode = pdg.summaryModes[node.timelineId];
    return isCollapsedMode(summaryMode);
  },

  /**
   * @param {RenderState} pdg 
   * @param {PDGTimelineNode} node
   */
  isExpandedGroupNode(pdg, node) {
    const summaryMode = pdg.summaryModes[node.timelineId];
    return isControlGroupTimelineNode(node.type) &&
      isExpandedMode(summaryMode);
  },

  /**
   * @param {RenderState} pdg 
   * @param {PDGTimelineNode} node
   */
  canNodeExpand(pdg, node) {
    // pdgQueries.getSummarizableChildren(this, node.timelineId).length
    // return pdgQueries.isNodeSummarizable(pdg, node) && 
    //   ;
    return pdgQueries.canApplySummaryMode(pdg, node, PDGSummaryMode.ExpandSelf);
  },

  /**
   * @param {RenderState} pdg 
   * @param {PDGTimelineNode} node
   */
  hasSummarizableChildren(pdg, node) {
    return !!pdgQueries.getSummarizableChildren(pdg, node.timelineId).length;
  },

  /**
   * @param {RenderState} pdg 
   * @param {PDGTimelineNode} node
   */
  getSummarizableChildren(pdg, timelineId) {
    const node = pdg.timelineNodes[timelineId];
    return Object.values(node.children || EmptyObject)
      .map(childId => {
        const child = pdg.timelineNodes[childId];
        return pdgQueries.isNodeSummarizable(pdg, child) ? child : null;
      })
      .filter(Boolean);
  },

  /**
   * @param {RenderState} pdg 
   * @param {PDGTimelineNode} node
   */
  isSnapshot(pdg, node) {
    return node.type === PDGTimelineNodeType.RefSnapshot;
  },

  isDeleteNode(pdg, node) {
    return node.type === PDGTimelineNodeType.DeleteEntry;
  },

  /**
   * Whether given node is a snapshot that has at least one nested snapshot.
   * 
   * @param {RenderState} pdg 
   * @param {PDGSnapshotNode} node 
   */
  isNestingSnapshot(pdg, node) {
    return pdgQueries.isSnapshot(pdg, node) &&
      Object.values(node.children).some(childId => pdgQueries.isSnapshot(pdg, pdg.timelineNodes[childId]));
  },

  /** ###########################################################################
   * "advanced" queries
   * ##########################################################################*/

  /**
   * @param {RenderState} pdg 
   * @param {PDGTimelineNode} node
   */
  getRootTimelineNode(pdg, node) {
    return node?.rootTimelineId && pdg.timelineNodes[node.rootTimelineId];
  },

  /** ###########################################################################
   * Summary queries
   *  #########################################################################*/

  /**
   * @param {RenderState} pdg 
   * @param {PDGTimelineNode} node
   */
  isNodeSummarized(pdg, node) {
    return pdgQueries.isNodeSummarizedMode(pdg, node) &&
      pdgQueries.doesNodeHaveSummary(pdg, node);
  },

  /**
   * @param {RenderState} pdg 
   * @param {PDGTimelineNode} node
   */
  isNodeSummarizedMode(pdg, node) {
    const summaryMode = pdg.summaryModes[node.timelineId];
    return isSummaryMode(summaryMode);
  },

  /**
   * Whether the summary of this node has already been prepared.
   * 
   * @param {RenderState} pdg 
   * @param {PDGTimelineNode} node
   */
  doesNodeHaveSummary(pdg, node) {
    const nodeSummary = pdg.nodeSummaries[node.timelineId];
    if (!nodeSummary) {
      return false;
    }
    return !!nodeSummary.summaryRoots?.length || nodeSummary.hasNestedSummaries;
  },

  wasNodeSummarizedBefore(pdg, node) {
    const nodeSummary = pdg.nodeSummaries[node.timelineId];
    return !!nodeSummary;
  },

  /**
   * WARNING: This will check "summarizability" recursively
   * 
   * @param {RenderState} pdg 
   * @param {PDGTimelineNode} node
   */
  isNodeSummarizable(pdg, node) {
    return (
      !isPDGRoot(node.timelineId) &&
      node.hasSummarizableWrites && (
        !isControlGroupTimelineNode(node.type) ||
        (
          // it itself can be summarized
          (
            // we don't know yet
            !pdgQueries.wasNodeSummarizedBefore(pdg, node) ||

            // actually check if summary is non-empty
            pdgQueries.doesNodeHaveSummary(pdg, node)
          ) ||
          // children can be summarized
          (
            pdgQueries.hasSummarizableChildren(pdg, node)
          )
        )
      )
    );
  },

  /**
   * @param {RenderState} pdg 
   * @param {PDGTimelineNode} node
   */
  getVisibleSummary(pdg, node) {
    const isSummarized = pdgQueries.isNodeSummarized(pdg, node);
    if (isSummarized) {
      return pdg.nodeSummaries[node.timelineId];
    }
    return null;
  },

  /**
   * Returns summary roots.
   * 
   * @param {RenderState} pdg 
   * @param {PDGNodeSummary} summary
   */
  getSummaryRoots(pdg, summary) {
    const rootIds = summary.summaryRoots;
    return rootIds?.map(id => pdg.timelineNodes[id]);
  },

  /**
   * Returns *all* snapshots in summary.
   * 
   * @param {RenderState} pdg 
   * @param {PDGNodeSummary} summary
   */
  getSummarySnapshots(pdg, summary) {
    const summaryNodeIds = Array.from(summary.snapshotsByRefId.values());
    return summaryNodeIds.map(id => pdg.timelineNodes[id]);
  },

  /**
   * @param {RenderState} pdg 
   * @param {PDGTimelineNode} node
   * @return {PDGNodeSummary} Summary of first summarized ancestor node.
   */
  getSummarizedGroupOfNode(pdg, node) {
    let current = node;
    while (current && !pdgQueries.isNodeSummarizedMode(pdg, current) && current.groupId) {
      current = pdg.timelineNodes[current.groupId];
    }
    return current && pdg.nodeSummaries[current.timelineId] || null;
  },

  /** ###########################################################################
   * Handle summary modes
   * ##########################################################################*/

  /**
   * @param {BasePDG} pdg 
   */
  canApplySummaryMode(pdg, node, mode) {
    // const node = pdg.timelineNodes[timelineId];
    if (!_canApplySummaryMode[mode]) {
      throw new Error(`SummaryMode has not been configured: ${mode}`);
    }
    return _canApplySummaryMode[mode](pdg, node);
  },

  /** ###########################################################################
   * util
   * ##########################################################################*/

  /**
   * NOTE: this excludes ValueNodes nodes inside of summary snapshots.
   * 
   * @param {RenderState} pdg 
   */
  getAllVisibleNodes(pdg) {
    return pdg.timelineNodes
      // filter visible
      .filter(node => !!node && pdgQueries.isVisible(pdg, node))

      // add all summary nodes
      .concat(Object.values(pdg.nodeSummaries || EmptyObject).map(summary => {
        return summary && pdgQueries.getSummarySnapshots(pdg, summary);
      }))
      .filter(Boolean)
      .flat();
  },

  /**
   * 
   * @param {RenderState} pdg 
   * @param {PDGTimelineNode} node
   */
  isSnapshotRoot(pdg, node) {
    return node.rootTimelineId && !node.parentNodeId;
  },

  /**
   * Whether `inner` is descendant of `outer`
   * 
   * @param {RenderState} pdg
   * @param {RefSnapshotTimelineNode} outer
   * @param {RefSnapshotTimelineNode} inner
   */
  isSnapshotDescendant(pdg, outer, inner) {
    const { parentNodeId } = inner;
    if (!parentNodeId) {
      return false;
    }
    const parentNode = pdg.timelineNodes[parentNodeId];
    if (parentNode === outer) {
      return true;
    }

    return pdgQueries.isSnapshotDescendant(pdg, outer, parentNode);
  },
};

/** ###########################################################################
 * host queries
 * ##########################################################################*/

/**
 * Queries that are only supported on the host, due to
 * dependencies on `dp` etc.
 */
export const pdgHostQueries = {
  /**
   * @param {DataDependencyGraph} pdg 
   * @param {PDGTimelineNode} node
   */
  getRootDataNodeId(pdg, node) {
    const rootTimelineNode = pdgQueries.getRootTimelineNode(pdg, node);
    return rootTimelineNode?.dataNodeId || node.dataNodeId;
  },

  /**
   * @param {DataDependencyGraph} pdg 
   * @param {PDGTimelineNode} node
   */
  getRootDataNode(pdg, node) {
    const rootDataNodeId = pdgHostQueries.getRootDataNodeId(pdg, node);
    return rootDataNodeId && pdg.dp.util.getDataNode(rootDataNodeId);
  },

  /**
   * NOTE: a snapshot (as of now) cannot have children of a later trace than its root.
   * 
   * @param {DataDependencyGraph} pdg 
   * @param {PDGTimelineNode} node
   */
  getLastDataNodeIdInRoot(pdg, node) {
    const rootDataNode = pdgHostQueries.getRootDataNode(pdg, node);
    const rootTrace = rootDataNode.traceId;
    return pdg.dp.util.getLastDataNodeIdOfTrace(rootTrace);
  }
};

export default pdgQueries;
