import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { RootTimelineId } from './constants';
import BaseDDG from './BaseDDG';
import { EdgeState } from './DDGEdge';
import DDGSummaryMode, { isSummaryMode, isCollapsedMode, isShownMode } from './DDGSummaryMode';
import { DDGTimelineNode } from './DDGTimelineNodes';
import ddgQueries from './ddgQueries';
import DDGEdgeType from './DDGEdgeType';
import DDGNodeSummary from './DDGNodeSummary';

/** ###########################################################################
 * default config
 * ##########################################################################*/

// const RootDefaultSummaryMode = {
// };
const RootDefaultSummaryMode = DDGSummaryMode.ExpandSelf;
// const RootDefaultSummaryMode = DDGSummaryMode.HideChildren;

/** ###########################################################################
 * utilities
 *  #########################################################################*/

class SummaryState {
  /**
   * From → To → summary state.
   * Indexed by `timelineId`.
   * 
   * @type {Map.<number, Map.<number, EdgeState>>}
   */
  visibleEdges = new Map();

  /**
   * This maps all nodes to the visible nodes that replace them.
   * Visible nodes are mapped to themselves.
   * Indexed by `timelineId`.
   * 
   * @type {Map.<number, Array.<DDGTimelineNode>}
   */
  nodeRouteMap = new Map();

  /**
   * Represents the currently collapsed ancestor.
   * All nested edges will be re-routed to it.
   */
  currentCollapsedAncestor = null;

  addEdge(from, to, type) {
    const { visibleEdges } = this;
    let edgeTargets = visibleEdges.get(from.timelineId);
    if (!edgeTargets) {
      visibleEdges.set(from.timelineId, edgeTargets = new Map());
    }
    let edgeState = edgeTargets.get(to.timelineId);
    if (!edgeState) {
      edgeTargets.set(to.timelineId, edgeState = new EdgeState());
    }
    edgeState.nByType[type] = (edgeState.nByType[type] || 0) + 1;
  }
}


/** ###########################################################################
 * {@link DataDependencyGraph}
 *  #########################################################################*/

/**
 * 
 */
export default class DataDependencyGraph extends BaseDDG {
  /**
   * The complete base graph
   * @type {DataDependencyGraph}
   */
  og;

  /**
   * @type {Object.<number, SummaryModeValue>}
   */
  summaryModes = {};

  /**
   * Summary data by `timelineId`.
   * NOTE: This is built lazily in `buildNodeSummary`.
   * 
   * @type {Object.<number, DDGNodeSummary>}
   */
  nodeSummaries = {};

  constructor(dp, graphId) {
    super(dp, graphId);
  }

  getRenderData() {
    const {
      // original node data
      og: {
        timelineNodes,
      },

      // summarized edge data
      summaryModes,
      edges,
      outEdgesByTimelineId,
      inEdgesByTimelineId
    } = this;

    return {
      timelineNodes,

      summaryModes,
      edges,
      outEdgesByTimelineId,
      inEdgesByTimelineId
    };
  }

  /**
   * The data that changes over time.
   */
  getChangingData() {
    const {
      summaryModes,
      edges,
      outEdgesByTimelineId,
      inEdgesByTimelineId
    } = this;

    return {
      summaryModes,
      edges,
      outEdgesByTimelineId,
      inEdgesByTimelineId
    };
  }

  /** ###########################################################################
   * getters
   * ##########################################################################*/

  get watchSet() {
    return this.og.watchSet;
  }

  get bounds() {
    return this.og.bounds;
  }

  get timelineNodes() {
    return this.og.timelineNodes;
  }

  applyModeHandlers = {
    [DDGSummaryMode.Show]: (timelineId) => {
      // Nothing to do.
      // NOTE: Show is only used on leaf nodes (others are collapsed, expanded etc.)

      // const { og } = this;
      // const node = og.timelineNodes[timelineId];

      // // hide all children
      // for (const childId of node.children) {
      //   // const childNode = og.timelineNodes[childId];
      //   this.#applyMode(childId, DDGSummaryMode.Show);
      // }
    },
    [DDGSummaryMode.Hide]: (timelineId) => {
      const { og } = this;
      const node = og.timelineNodes[timelineId];

      if (node.children) {
        // hide all children
        for (const childId of node.children) {
          // const childNode = og.timelineNodes[childId];
          this.#applyMode(childId, DDGSummaryMode.Hide);
        }
      }
    },
    [DDGSummaryMode.Collapse]: (timelineId) => {
      const { og } = this;
      const node = og.timelineNodes[timelineId];

      // hide all children
      for (const childId of node.children) {
        // const childNode = og.timelineNodes[childId];
        this.#applyMode(childId, DDGSummaryMode.Hide);
      }
    },
    [DDGSummaryMode.ExpandSelf]: (timelineId) => {
      const { og } = this;
      const node = og.timelineNodes[timelineId];

      // collapse all children
      for (const childId of node.children) {
        const childNode = og.timelineNodes[childId];
        const targetMode = ddgQueries.canApplySummaryMode(childNode, DDGSummaryMode.Collapse) ?
          DDGSummaryMode.Collapse :
          DDGSummaryMode.Show;
        this.#applyMode(childId, targetMode);
      }
    },
    [DDGSummaryMode.ExpandSubgraph]: (timelineId) => {
      const { og } = this;
      const node = og.timelineNodes[timelineId];

      // expand all children and their children
      for (const childId of node.children) {
        const childNode = og.timelineNodes[childId];
        const targetMode = ddgQueries.canApplySummaryMode(childNode, DDGSummaryMode.Collapse) ?
          DDGSummaryMode.ExpandSubgraph :
          DDGSummaryMode.Show;
        this.#applyMode(childId, targetMode);
      }
    },
    [DDGSummaryMode.HideChildren]: (timelineId) => {
      const { og } = this;
      const node = og.timelineNodes[timelineId];

      // hide all children
      for (const childId of node.children) {
        this.#applyMode(childId, DDGSummaryMode.Hide);
      }
    }
  };

  #applyMode(timelineId, mode) {
    const { og } = this;
    const node = og.timelineNodes[timelineId];
    if (ddgQueries.canApplySummaryMode(node, mode)) {
      this.summaryModes[timelineId] = mode;
      this.applyModeHandlers[mode](timelineId);
    }
  }

  /** ###########################################################################
   * public controls
   *  #########################################################################*/

  setMergeComputes(on) {
    // TODO
  }

  setSummaryMode(timelineId, mode) {
    // update node modes
    this.#applyMode(timelineId, mode);

    // refresh the summarized graph
    this.#applySummarization();
  }

  /** ###########################################################################
   * build
   * ##########################################################################*/

  /**
   * @param {number[]} watchTraceIds 
   */
  build(watchTraceIds) {
    if (!this.og) {
      this.og = new BaseDDG(this.dp, this.graphId);
    }
    this.og.build(watchTraceIds);

    this.#initSummaryConfig();
    this.#applySummarization();
  }

  /** ###########################################################################
   * init stuff
   * ##########################################################################*/

  resetBuild() {
    super.resetBuild();
  }

  #initSummaryConfig() {
    this.summaryModes = {};

    // update node modes
    this.#applyMode(RootTimelineId, RootDefaultSummaryMode);
  }

  /** ###########################################################################
   *  summarize algo
   * ##########################################################################*/

  #applySummarization() {
    const { og: { root } } = this;

    const summaryState = new SummaryState();
    this.#summarizeDFS(root, summaryState);

    this.resetBuild();

    // add all edges
    for (const [from, toMap] of summaryState.visibleEdges) {
      for (const [to, edgeState] of toMap) {
        // TODO: edgeType
        const edgeType = DDGEdgeType.Data;
        this.addEdge(edgeType, from, to, edgeState);
      }
    }
  }

  #get

  /**
   * 
   * @param {DDGTimelineNode} node 
   * @param {SummaryState} summaryState 
   */
  #summarizeDFS(node, summaryState) {
    let {
      nodeRouteMap,
      currentCollapsedAncestor
    } = summaryState;
    const { timelineId } = node;

    const isVisible = !currentCollapsedAncestor && ddgQueries.isVisible(this, node);
    const isCollapsed = !currentCollapsedAncestor && ddgQueries.isCollapsed(this, node);
    const needsSummaryData = !currentCollapsedAncestor && ddgQueries.isNodeSummarized(this, node);
    const summaryRepresentatingNode = currentCollapsedAncestor || node;
    let isSummarized = ddgQueries.isNodeSummarized(this, summaryRepresentatingNode);

    if (needsSummaryData) {
      // build node summary (if not already built)
      this.og.timelineBuilder.buildNodeSummary(timelineId);
    }

    if (node.children) {
      // node has children
      if (isCollapsed) {
        summaryState.currentCollapsedAncestor = node;
      }
      for (const childId of node.children) {
        const childNode = this.og.timelineNodes[childId];
        this.#summarizeDFS(childNode, summaryState);
      }
      if (isCollapsed) {
        // reset collapsed ancestor
        summaryState.currentCollapsedAncestor = null;
      }
    }

    if (isSummarized) {
      const nodeSummary = this.nodeSummaries[summaryRepresentatingNode.timelineId];
      isSummarized = !!nodeSummary?.summaryNodes?.length;
      if (isSummarized) {
        // TODO: during buildNodeSummary:
        /**
         * 1. don't add edges or snapshotsByDataNode etc. data
         * 2. determine set of all "output refs"
         * 3. merge writes from other refs into "output refs"
         */

        // TODO: re-route to summaryNodes (via DataNode.varAccess) below
        nodeSummary.summaryNodes;
      }
    }

    // TODO: prevent duplicate edges

    // add/merge incoming edges
    const incomingEdges = this.og.inEdgesByTimelineId[timelineId] || EmptyArray;

    if (isVisible) {
      // node is shown
      nodeRouteMap.set(timelineId, [node]);

      for (const edgeId of incomingEdges) {
        const edge = this.og.edges[edgeId];
        const { from: fromOg, type } = edge;
        const allFrom = nodeRouteMap.get(fromOg);
        if (allFrom) {
          for (const from of allFrom) {
            summaryState.addEdge(from, node, type);
          }
        }
      }
    }
    else if (currentCollapsedAncestor) {
      // node is collapsed into given ancestor
      nodeRouteMap.set(timelineId, [currentCollapsedAncestor]);

      for (const edgeId of incomingEdges) {
        const edge = this.og.edges[edgeId];
        const { from: fromOg, type } = edge;
        const allFrom = nodeRouteMap.get(fromOg);
        if (allFrom) {
          for (const from of allFrom) {
            if (from !== currentCollapsedAncestor) {
              // TODO: look up summary node by `dataNode.varAccess`
              summaryState.addEdge(from, currentCollapsedAncestor, type);
            }
          }
        }
      }
    }
    else {
      // node is hidden
      // → multicast all outgoing edges to all incoming edges
      // → to that end, add all `from`s to this node's `reroutes`
      let reroutes = [];
      nodeRouteMap.set(timelineId, reroutes);

      for (const edgeId of incomingEdges) {
        const edge = this.og.edges[edgeId];
        const { from: fromOg, type } = edge;
        // TODO: integrate edge type correctly
        const allFrom = nodeRouteMap.get(fromOg);
        if (allFrom) {
          for (const from of allFrom) {
            reroutes.push(from);
          }
        }
      }
    }
  }
}
