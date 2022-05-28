import { RootTimelineId } from './constants';
import BaseDDG from './BaseDDG';
import { EdgeState } from './DDGEdge';
import DDGSummaryMode, { isCollapsedMode, isShownMode } from './DDGSummaryMode';
import { DDGTimelineNode } from './DDGTimelineNodes';
import ddgQueries from './ddgQueries';
import DDGEdgeType from './DDGEdgeType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';

/** ###########################################################################
 * default config
 * ##########################################################################*/

// const RootDefaultSummaryMode = {
// };
const RootDefaultSummaryMode = DDGSummaryMode.ExpandSelf;

/** ###########################################################################
 * utilities
 *  #########################################################################*/

class SummaryState {
  /**
   * From → To → summary state.
   * Index all in dataTimelineIds.
   * 
   * @type {Map.<number, Map.<number, EdgeState>>}
   */
  visibleEdges = new Map();

  /**
   * This maps all nodes to the visible nodes that replace them.
   * Visible nodes are mapped to themselves.
   * Indexed by `dataTimelineId`.
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
    let edgeTargets = visibleEdges.get(from.dataTimelineId);
    if (!edgeTargets) {
      visibleEdges.set(from.dataTimelineId, edgeTargets = new Map());
    }
    let edgeState = edgeTargets.get(to.dataTimelineId);
    if (!edgeState) {
      edgeTargets.set(to.dataTimelineId, edgeState = new EdgeState());
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
   * Set of all currently visible nodes' `timelineId`.
   * @type {Set.<number>}
   */
  visibleNodes;

  summaryModes = {};

  constructor(dp, graphId) {
    super(dp, graphId);
  }

  getRenderData() {
    const {
      // original node data
      og: {
        timelineNodes,
        timelineDataNodes,
      },

      // summarized edge data
      edges,
      outEdgesByDataTimelineId,
      inEdgesByDataTimelineId,

      // and more
      summaryModes,
      visibleNodes
    } = this;

    return {
      timelineNodes,
      timelineDataNodes,
      edges,
      outEdgesByDataTimelineId,
      inEdgesByDataTimelineId,
      summaryModes,
      visibleNodes
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

  get timelineDataNodes() {
    return this.og.timelineDataNodes;
  }

  applyModeHandlers = {
    [DDGSummaryMode.Show]: (timelineId) => {
      // nothing to do
    },
    [DDGSummaryMode.Hide]: (timelineId) => {
      // nothing to do
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
        const targetMode = ddgQueries.canApplyMode(childNode, DDGSummaryMode.Collapse) ? DDGSummaryMode.Collapse : DDGSummaryMode.Show;
        this.#applyMode(childId, targetMode);
      }
    },
    [DDGSummaryMode.ExpandSubgraph]: (timelineId) => {
      const { og } = this;
      const node = og.timelineNodes[timelineId];

      // expand all children and their children
      for (const childId of node.children) {
        // const childNode = og.timelineNodes[childId];
        this.#applyMode(childId, DDGSummaryMode.ExpandSubgraph);
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
    if (ddgQueries.canApplyMode(node, mode)) {
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

    this._initBuild();
    this.#initSummaryConfig();
    this.#applySummarization();
  }

  /** ###########################################################################
   * init stuff
   * ##########################################################################*/

  _initBuild() {
    super._initBuild();
    this.visibleNodes = new Set();
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

    // add all edges
    for (const [from, toMap] of summaryState.visibleEdges) {
      for (const [to, edgeState] of toMap) {
        // TODO: edgeType
        const edgeType = DDGEdgeType.Data;
        this.addEdge(edgeType, from, to, edgeState);
      }
    }

    // TODO: we don't need to change the nodes.
    //    → Keep og nodes on client, and only send updated `summaryState` and edges instead!
  }

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

    const { summaryModes } = this;
    const summaryMode = summaryModes[node.timelineId];
    const isShown = !currentCollapsedAncestor && (node.watched || isShownMode(summaryMode));
    const isCollapsed = !currentCollapsedAncestor && isCollapsedMode(summaryMode);

    if (isShown) {
      this.visibleNodes.add(node.timelineId);
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

    if (node.dataTimelineId) {
      // node has edges
      const incomingEdges = this.og.inEdgesByDataTimelineId[node.dataTimelineId] || EmptyArray;

      if (isShown) {
        // node is shown
        nodeRouteMap.set(node.dataTimelineId, [node]);

        for (const { from: fromOg, type } of incomingEdges) {
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
        nodeRouteMap.set(node.dataTimelineId, [currentCollapsedAncestor]);

        for (const { from: fromOg, type } of incomingEdges) {
          const allFrom = nodeRouteMap.get(fromOg);
          if (allFrom) {
            for (const from of allFrom) {
              if (from !== currentCollapsedAncestor) {
                summaryState.addEdge(from, currentCollapsedAncestor, type);
              }
            }
          }
        }
      }
      else {
        // node is completely gone
        // → multicast all incoming to all outgoing edges
        let reroutes = [];
        nodeRouteMap.set(node.dataTimelineId, reroutes);

        for (const { from: fromOg, type } of incomingEdges) {
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
}
