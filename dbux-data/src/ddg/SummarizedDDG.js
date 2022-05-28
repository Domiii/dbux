
/** @typedef { import("./DataDependencyGraph").default } DataDependencyGraph */

import { isControlGroupTimelineNode } from '@dbux/common/src/types/constants/DDGTimelineNodeType';
import { RootTimelineId } from './constants';
import DataDependencyGraph from './DataDependencyGraph';
import DDGSummaryMode from './DDGSummaryMode';
import { DDGTimelineNode } from './DDGTimelineNodes';

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
   * All visible nodes.
   * @type {DDGTimelineNode}
   */
  visibleNodes = [];

  /**
   * From → To → summary state.
   * Index all in dataTimelineIds.
   * 
   * @type {Map.<number, Map.<number, EdgeState>>}
   */
  visibleEdges = new Map();

  /**
   * This maps all nodes to the visible node that summarizes them.
   * Visible nodes are mapped to themselves.
   * @type {Map.<DDGTimelineNode, Array.<DDGTimelineNode>}
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
 * {@link SummarizedDDG}
 *  #########################################################################*/

export default class SummarizedDDG extends DataDependencyGraph {
  /**
   * The complete base graph
   * @type {DataDependencyGraph}
   */
  og;

  summaryModes = {};

  constructor(dp, graphId) {
    super(dp, graphId);
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

  /** ###########################################################################
   * Handle summary modes
   * ##########################################################################*/

  canApplyMode = {
    [DDGSummaryMode.Show]: (timelineId) => {
      const { og } = this;
      const node = og.timelineNodes[timelineId];
      return (
        !!node.dataNodeId ||
        !og.watchSet.isWatchedDataNode(node.dataNodeId)
      );
    },
    [DDGSummaryMode.Hide]: (timelineId) => {
      const { og } = this;
      const node = og.timelineNodes[timelineId];
      return (
        !!node.dataNodeId &&
        !og.watchSet.isWatchedDataNode(node.dataNodeId)
      );
      /* timelineId !== RootTimelineId && // NOTE: we cannot hide the root */
    },
    [DDGSummaryMode.Collapse]: (timelineId) => {
      const { og } = this;
      const node = og.timelineNodes[timelineId];
      // return Array.isArray(node.children);
      return isControlGroupTimelineNode(node.type);
    },
    [DDGSummaryMode.ExpandSelf]: (timelineId) => {
      const { og } = this;
      const node = og.timelineNodes[timelineId];
      // return Array.isArray(node.children);
      return isControlGroupTimelineNode(node.type);
    },
    [DDGSummaryMode.ExpandSubgraph]: (timelineId) => {
      const { og } = this;
      const node = og.timelineNodes[timelineId];
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
      // const { og } = this;
      // const node = og.timelineNodes[timelineId];
      // // hide all children
      // for (const childId of node.children) {
      //   // const childNode = og.timelineNodes[childId];
      //   this.applyMode(childId, DDGSummaryMode.Hide);
      // }
    },
    [DDGSummaryMode.Collapse]: (timelineId) => {
      const { og } = this;
      const node = og.timelineNodes[timelineId];

      // hide all children
      for (const childId of node.children) {
        // const childNode = og.timelineNodes[childId];
        this.applyMode(childId, DDGSummaryMode.Hide);
      }
    },
    [DDGSummaryMode.ExpandSelf]: (timelineId) => {
      const { og } = this;
      const node = og.timelineNodes[timelineId];

      // collapse all children
      for (const childId of node.children) {
        // const childNode = og.timelineNodes[childId];
        this.applyMode(childId, DDGSummaryMode.Collapse);
      }
    },
    [DDGSummaryMode.ExpandSubgraph]: (timelineId) => {
      const { og } = this;
      const node = og.timelineNodes[timelineId];

      // expand all children and their children
      for (const childId of node.children) {
        // const childNode = og.timelineNodes[childId];
        this.applyMode(childId, DDGSummaryMode.ExpandSubgraph);
      }
    },
    [DDGSummaryMode.HideChildren]: (timelineId) => {
      const { og } = this;
      const node = og.timelineNodes[timelineId];

      // hide all children
      for (const childId of node.children) {
        this.applyMode(childId, DDGSummaryMode.Hide);
      }
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
      this.applyModeHandlers[mode](timelineId);
      this.setSummaryMode(timelineId, mode);
    }
  }

  /** ###########################################################################
   * public controls
   *  #########################################################################*/

  setMergeComputes(on) {
    // TODO
  }

  setSummaryMode(timelineId, mode) {
    this.summaryModes[timelineId] = mode;

    // update node modes
    this.applyMode(timelineId, mode);

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
      this.og = new DataDependencyGraph(this.dp, this.graphId);
    }
    this.og.build(watchTraceIds);

    this._initBuild();
    this.#initSummaryConfig();
    this.#applySummarization();
  }

  /** ###########################################################################
   * summarize utilities
   * ##########################################################################*/

  #initSummaryConfig() {
    this.summaryModes = {
      [RootTimelineId]: RootDefaultSummaryMode
    };
  }

  /** ###########################################################################
   *  summarize algo
   * ##########################################################################*/

  #applySummarization() {
    const { og: { root } } = this;

    this.#summarizeDFS(root, new SummaryState());
  }

  /**
   * 
   * @param {DDGTimelineNode} node 
   * @param {SummaryState} summaryState 
   */
  #summarizeDFS(node, summaryState) {
    const { summaryModes } = this;
    let {
      visibleNodes,
      nodeRouteMap,
      currentCollapsedAncestor
    } = summaryState;

    if (show) {
      visibleNodes.push(node);
    }

    if (node.children) {
      // node has children
      if (!currentCollapsedAncestor && collapse) {
        summaryState.currentCollapsedAncestor = currentCollapsedAncestor = node;
      }
      for (const childId of node.children) {
        const childNode = this.og.timelineNodes[childId];
        this.#summarizeDFS(childNode, nodeRouteMap, currentCollapsedAncestor);
      }
    }

    if (node.dataTimelineId) {
      // node has edges
      const incomingEdges = this.og.inEdgesByDataTimelineId[node.dataTimelineId];

      if (show) {
        // node is shown
        nodeRouteMap.set(node.timelineId, [node]);

        for (const { from: fromOg, type } of incomingEdges) {
          const allFrom = nodeRouteMap[fromOg];
          if (allFrom) {
            for (const from of allFrom) {
              summaryState.addEdge(from, node, type);
            }
          }
        }
      }
      else if (currentCollapsedAncestor) {
        // node is replaced with given ancestor
        nodeRouteMap.set(node.timelineId, [currentCollapsedAncestor]);

        for (const { from: fromOg, type } of incomingEdges) {
          const allFrom = nodeRouteMap[fromOg];
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
        nodeRouteMap.set(node.timelineId, reroutes);

        for (const { from: fromOg, type } of incomingEdges) {
          // TODO: integrate this type correctly?
          const allFrom = nodeRouteMap[fromOg];
          if (allFrom) {
            for (const from of allFrom) {
              reroutes.push(from);
            }
          }
        }
      }

      
      // TODO: we don't need to change the nodes. Keep og nodes on client, and only send updated `summaryState` and edges instead!
      // TODO: call builder to add nodes + edges
    }
  }
}
