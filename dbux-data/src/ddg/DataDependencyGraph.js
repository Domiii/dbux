import NanoEvents from 'nanoevents';
import { throttle } from '@dbux/common/src/util/scheduling';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import Enum from '@dbux/common/src/util/Enum';
import DataNodeType, { isDataNodeModifyOrComputeType, isDataNodeModifyType } from '@dbux/common/src/types/constants/DataNodeType';
import DDGTimelineNodeType, { isControlGroupTimelineNode } from '@dbux/common/src/types/constants/DDGTimelineNodeType';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { DDGRootTimelineId, isDDGRoot } from './constants';
import BaseDDG from './BaseDDG';
import { EdgeState } from './DDGEdge';
import DDGSummaryMode, { isSummaryMode, isCollapsedMode, isShownMode, isExpandedMode } from './DDGSummaryMode';
import ddgQueries from './ddgQueries';
import DDGNodeSummary from './DDGNodeSummary';
import { DDGTimelineNode } from './DDGTimelineNodes';
import DDGSettings from './DDGSettings';

/** @typedef {import('@dbux/common/src/types/RefSnapshot').ISnapshotChildren} ISnapshotChildren */
/** @typedef { Map.<number, number> } SnapshotMap */

// const VerboseSumm = 2;
const VerboseSumm = 0;

/** ###########################################################################
 * default config
 * ##########################################################################*/

// const RootDefaultSummaryMode = {
// };
// const RootDefaultSummaryMode = DDGSummaryMode.SummarizeChildren;
const RootDefaultSummaryMode = DDGSummaryMode.HideChildren;

/** ###########################################################################
 * {@link BuildStage}
 * ##########################################################################*/

const buildStageObj = {
  None: 0,
  /**
   * Building initial graph.
   */
  Building: 1,
  /**
   * Building a summarized graph from an already existing initial graph.
   */
  Summarizing: 2
};
const BuildStage = new Enum(buildStageObj);

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
  buildStage = BuildStage.None;

  /**
   * The complete base graph
   * @type {BaseDDG}
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
   * @type {Object.<string, DDGNodeSummary>}
   */
  nodeSummaries = {};

  /**
   * @type {DDGSettings}
   */
  settings = new DDGSettings();

  /** ########################################
   * other
   * #######################################*/

  _emitter = new NanoEvents();

  debugValueId;

  constructor(ddgSet, graphId) {
    super(ddgSet, graphId);
  }

  getRenderData() {
    const {
      // original node data
      og: {
        timelineNodes,
      }
    } = this;

    return {
      timelineNodes,

      ...this.getChangingData()
    };
  }

  /**
   * This data changes over time and is sent back to client
   * on every update.
   */
  getChangingData() {
    const {
      settings,

      // summary data
      summaryModes,
      nodeSummaries,

      // current edge data
      edges,
      outEdgesByTimelineId,
      inEdgesByTimelineId
    } = this;

    return {
      settings,
      summaryModes,
      nodeSummaries,
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

  /**
   * hackfix: remove this once we fixed decisions
   */
  get decisionTimelineNodes() {
    return this.og.decisionNodes;
  }

  get timelineNodesByDataNodeId() {
    return this.og.timelineNodesByDataNodeId;
  }

  get timelineBuilder() {
    return this.og.timelineBuilder;
  }

  get isBuilding() {
    return BuildStage.is.Building(this.buildStage);
  }

  get isSummarizing() {
    return BuildStage.is.Summarizing(this.buildStage);
  }

  /** ###########################################################################
   * public control methods
   *  #########################################################################*/

  /**
   * @param {DDGSettings} settings 
   */
  updateSettings(settings) {
    for (const name in settings) {
      if (!(name in this.settings)) {
        throw new Error(`invalid graph setting: ${name} (${JSON.stringify(settings)})`);
      }
    }
    this.settings = settings;

    // build graph again
    // TODO: not all settings need a re-build
    this.#buildSummarizedGraph();
  }

  /**
   * Convinient little tool
   */
  toggleSummaryMode(timelineId) {
    const { summaryModes } = this;
    const summaryMode = summaryModes[timelineId];
    if (isExpandedMode(summaryMode)) {
      // collapse
      if (!this.setSummaryMode(timelineId, DDGSummaryMode.CollapseSummary)) {
        // NOTE: cannot collapse: ignore for now
        // TODO: there is a chance that this node cannot render anything anyway, because it only has disconnected ancestors etc.
      }
    }
    else {
      // expand
      const summarizableChildren = ddgQueries.getSummarizableChildren(this, timelineId);
      if (!summarizableChildren.length) {
        // nothing to summarize → expand in full instead
        this.setSummaryMode(timelineId, DDGSummaryMode.ExpandSubgraph);
      }
      else {
        this.setSummaryMode(timelineId, DDGSummaryMode.ExpandSelf);
        if (summarizableChildren.length === 1 &&
          !isExpandedMode(summaryModes[summarizableChildren[0].timelineId])
        ) {
          // open up single nested expandable child as well
          this.toggleSummaryMode(summarizableChildren[0].timelineId);
        }
      }
    }
  }

  setSummaryMode(timelineId, mode) {
    // update node modes
    if (this.#applyMode(timelineId, mode)) {
      // refresh the summarized graph
      this.#buildSummarizedGraph();
      return true;
    }
    else {
      return false;
    }
  }


  /** ###########################################################################
   * summarization propagation
   * ##########################################################################*/

  propagateSummaryMode = {
    [DDGSummaryMode.Show]: (timelineId) => {
      const { og } = this;
      const node = og.timelineNodes[timelineId];

      if (node.children) {
        // show all children
        for (const childId of Object.values(node.children)) {
          // const childNode = og.timelineNodes[childId];
          this.#applyMode(childId, DDGSummaryMode.Show);
        }
      }
    },
    [DDGSummaryMode.Hide]: (timelineId) => {
      const { og } = this;
      const node = og.timelineNodes[timelineId];

      if (node.children) {
        // hide all children
        for (const childId of Object.values(node.children)) {
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
    [DDGSummaryMode.CollapseSummary]: (timelineId) => {
      const { og } = this;
      const node = og.timelineNodes[timelineId];

      // hide all children
      for (const childId of node.children) {
        // const childNode = og.timelineNodes[childId];
        this.#applyMode(childId, DDGSummaryMode.Hide);
      }
    },
    [DDGSummaryMode.SummarizeChildren]: (timelineId) => {
      const { og } = this;
      const node = og.timelineNodes[timelineId];

      // hide all children
      for (const childId of node.children) {
        const childNode = og.timelineNodes[childId];
        const targetMode = ddgQueries.canApplySummaryMode(this, childNode, DDGSummaryMode.Collapse) ?
          DDGSummaryMode.CollapseSummary :
          DDGSummaryMode.Hide;
        this.#applyMode(childId, targetMode);
      }
    },
    [DDGSummaryMode.ExpandSelf]: (timelineId) => {
      const { og } = this;
      const node = og.timelineNodes[timelineId];

      // collapse all children
      for (const childId of node.children) {
        const childNode = og.timelineNodes[childId];
        const targetMode = ddgQueries.canApplySummaryMode(this, childNode, DDGSummaryMode.Collapse) ?
          DDGSummaryMode.CollapseSummary : // temporary hackfix
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
        const targetMode = ddgQueries.canApplySummaryMode(this, childNode, DDGSummaryMode.Collapse) ?
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
    if (ddgQueries.canApplySummaryMode(this, node, mode)) {
      this.summaryModes[timelineId] = mode;
      this.propagateSummaryMode[mode](timelineId);
      return true;
    }
    return false;
  }


  /** ###########################################################################
   * build
   * ##########################################################################*/

  /**
   * @param {number[]} watchTraceIds 
   */
  build(watched) {
    if (!this.og) {
      this.og = new BaseDDG(this.ddgSet, this.graphId);
    }
    this.buildStage = BuildStage.Building;
    try {
      this.og.build(watched);
    }
    finally {
      this.buildStage = BuildStage.None;
    }

    this.buildStage = BuildStage.Summarizing;
    try {
      this.#initSummaryConfig();
      this.#buildSummarizedGraph();
    }
    finally {
      this.buildStage = BuildStage.None;
    }
  }

  /**
   * During initial build, not all details of every node are prepared.
   * When investigating a node's details, this function needs to run first.
   */
  #buildNodeSummary(timelineId) {
    return this.#buildNodeSummarySnapshotsAndVars(timelineId);
  }

  /** ###########################################################################
   * more reset + init stuff
   * ##########################################################################*/

  resetBuild() {
    this.resetEdges(); // only reset (set) edges
  }

  #initSummaryConfig() {
    this.summaryModes = {};

    // update node modes
    this.#applyMode(DDGRootTimelineId, RootDefaultSummaryMode);
  }

  /**
   * Used for nodes that are summarized by traceId.
   */
  #getSummarizingTraceId(dataNodeId) {
    const dataNode = this.dp.util.getDataNode(dataNodeId);
    return dataNode.varAccess?.declarationTid || dataNode.traceId;
  }

  /**
   * @param {number} timelineId Summary group node
   */
  #buildNodeSummarySnapshotsAndVars(timelineId) {
    const { dp } = this;
    const node = this.timelineNodes[timelineId];
    if (
      !node.hasSummarizableWrites ||
      // only non-root control groups
      isDDGRoot(timelineId) || !isControlGroupTimelineNode(node.type)
      /*  || this.nodeSummaries[timelineId] */ // build again, for dev purposes
    ) {
      // already built or nothing to build
      return this.nodeSummaries[timelineId];
    }

    const lastModifyNodesByRefId = new Map();           // summary ref set
    const varModifyOrReturnDataNodes = new Map();       // summary var + return set
    const lastNestedDataNodeId = this.#collectNestedUniqueSummaryTrees(node, node, lastModifyNodesByRefId, varModifyOrReturnDataNodes);
    const summaryRefEntries = Array.from(lastModifyNodesByRefId.entries())
      .filter(([refId]) => {
        // skip if this ref is only used internally (or before) this summary group and is not accessed AFTERWARDS.
        const lastDataNodeIdOfRef = Math.max(
          // check if accessed again
          dp.util.getLastDataNodeByRefId(refId)?.nodeId || 0,

          // check if shown in later watch node
          this.watchSet.lastDataNodeByWatchedRefs.get(refId) || 0
        );
        return lastDataNodeIdOfRef > lastNestedDataNodeId;
      });

    // add ref snapshots
    /**
     * @type {SnapshotMap}
     */
    const snapshotsByRefId = new Map();
    for (const [refId, dataNodeId] of summaryRefEntries) {
      if (snapshotsByRefId.has(refId)) {
        // skip if this ref was already added as a descendant of a previous ref
        continue;
      }
      const dataNode = dp.collections.dataNodes.getById(dataNodeId);
      const newNode = this.og.addNewRefSnapshot(dataNode, refId, snapshotsByRefId, null);

      // override label to be the var name (if possible), since its more representative
      newNode.label = dp.util.getDataNodeAccessedRefVarName(newNode.dataNodeId) || newNode.label;
    }

    // add var + compute nodes
    const varNodesByTid = new Map();
    for (const [declarationTid, varOrReturnNodeTimelineId] of varModifyOrReturnDataNodes) {
      const newNode = this.cloneNode(varOrReturnNodeTimelineId);

      // override label to be the var name (if possible), since its more representative
      newNode.label = dp.util.getDataNodeDeclarationVarName(newNode.dataNodeId) || newNode.label;
      const summarizingTraceId = this.#getSummarizingTraceId(newNode.dataNodeId);
      varNodesByTid.set(summarizingTraceId, newNode.timelineId);
    }

    const summaryRoots = (
      // ref roots
      Array.from(snapshotsByRefId.values())
        .filter(snapshotId => !this.timelineNodes[snapshotId].parentNodeId)
        .concat(
          // var roots
          Array.from(varNodesByTid.values())
        ));

    return this.nodeSummaries[timelineId] = new DDGNodeSummary(timelineId, snapshotsByRefId, varNodesByTid, summaryRoots);
  }

  /**
   * Finds all nested modified `refId`s nested in the given node and its descendants.
   * 
   * @param {DDGTimelineNode} summarizingNode
   * @param {DDGTimelineNode} node
   * @param {Map.<number, number>} lastModifyNodesByRefId
   * @return {number} The `lastDataNodeId` of the entire node.
   */
  #collectNestedUniqueSummaryTrees(summarizingNode, node, lastModifyNodesByRefId, varModifyOrReturnDataNodes) {
    const { dp } = this;
    let lastDataNodeId = node.dataNodeId;

    if (
      node.dataNodeId &&
      ddgQueries.checkNodeVisibilitySettings(this, node)
    ) {
      const refId = dp.util.getDataNodeModifyingRefId(node.dataNodeId);
      if (refId) {
        // Ref Write
        lastModifyNodesByRefId.set(refId, node.dataNodeId);
      }
      else {
        const dataNode = dp.collections.dataNodes.getById(node.dataNodeId);
        const varDeclarationTid = isDataNodeModifyOrComputeType(dataNode.type) && dataNode?.varAccess?.declarationTid;
        const isPreexistingVar = varDeclarationTid && (!summarizingNode.pushTid || varDeclarationTid < summarizingNode.pushTid);
        if (
          // Pre-existing variable Write or Compute
          isPreexistingVar ||

          // return argument
          (DDGTimelineNodeType.is.Context(summarizingNode.type) && dp.util.isReturnArgumentInputDataNode(node.dataNodeId))
        ) {
          // store variable writes, if variable was declared before summarizingNode
          varModifyOrReturnDataNodes.set(varDeclarationTid, node.timelineId);
        }
      }
    }
    if (node.children) {
      for (const childId of Object.values(node.children)) {
        const childNode = this.timelineNodes[childId];
        const lastChildDataNodeId = this.#collectNestedUniqueSummaryTrees(summarizingNode, childNode, lastModifyNodesByRefId, varModifyOrReturnDataNodes);
        if (lastChildDataNodeId) {
          lastDataNodeId = lastChildDataNodeId;
        }
      }
    }
    return lastDataNodeId;
  }

  /** ###########################################################################
   *  summarize algo
   * ##########################################################################*/

  #buildSummarizedGraph() {
    const { og: { root } } = this;

    this.resetBuild();

    const summaryState = new SummaryState();
    this.#summarizeDFS(root, summaryState);

    // // NOTE: store SummaryState for debugging purposes
    // this.graphSummaryState = summaryState;

    // add all edges
    for (const [from, toMap] of summaryState.visibleEdges) {
      for (const [to, edgeState] of toMap) {
        const edgeType = this.getEdgeType(this.timelineNodes[from], this.timelineNodes[to]);
        this.addEdge(edgeType, from, to, edgeState);
      }
    }

    this.#notifyUpdate();
    this.ddgSet._notifyUpdate(this);
  }

  #notifyUpdate = throttle(() => {
    this._emitter.emit('update', this);
  });

  onUpdate(cb) {
    return this._emitter.on('update', cb);
  }

  /**
   * 
   * @param {DDGTimelineNode} node 
   * @param {SummaryState} summaryState 
   */
  #summarizeDFS(node, summaryState) {
    const { dp } = this;
    let {
      nodeRouteMap,
      currentCollapsedAncestor
    } = summaryState;
    const { timelineId, dataNodeId, children } = node;


    // TODO: deal with invisible snapshot children?
    // node.parentNodeId ||  // don't hide snapshot children

    let isVisible = !!currentCollapsedAncestor || ddgQueries.isVisible(this, node);
    let targetNode = currentCollapsedAncestor || node;

    // prep
    if (!currentCollapsedAncestor) {
      // build node summary (if not already built)
      this.#buildNodeSummary(timelineId);

      // if (!ddgQueries.doesNodeHaveSummary(this, node)) {
      //   // straight up ignore for now
      //   return;
      // }
    }

    let isSummarized = !!currentCollapsedAncestor || ddgQueries.isNodeSummarized(this, node);

    // DFS recursion
    if (children) {
      const isCollapsed = !currentCollapsedAncestor &&
        ddgQueries.isCollapsed(this, node);
        // ddgQueries.doesNodeHaveSummary(this, node);
      if (isCollapsed) {
        // node is collapsed and has summary data (if not, just hide children)
        summaryState.currentCollapsedAncestor = node;
      }
      for (const childId of Object.values(children)) {
        const childNode = this.og.timelineNodes[childId];
        this.#summarizeDFS(childNode, summaryState);
      }
      if (isCollapsed) {
        // reset collapsed ancestor
        summaryState.currentCollapsedAncestor = null;
      }
    }

    // find summary targetNode (if it has any)
    if (isSummarized) {
      if (
        // summarized nodes without own `dataNodeId` (such as groups) are simply hidden
        !dataNodeId ||
        // summarization is empty → hide it (for now)
        !ddgQueries.doesNodeHaveSummary(this, targetNode)
      ) {
        targetNode = null;
        isVisible = false;
      }
      else {
        const nodeSummary = this.nodeSummaries[targetNode.timelineId];
        const dataNode = dp.collections.dataNodes.getById(dataNodeId); // dataNode must exist if summarized
        // link to summaryNode instead of `targetNode`
        targetNode = this.#lookupSummaryNode(dataNode, nodeSummary);
        if (!targetNode) {
          // NOTE: we simply "hide" nodes that do not have a summarized representation (leads to its edges getting propagated)
          isVisible = false;
        }
      }
    }

    // add/merge incoming edges
    const incomingEdges = this.og.inEdgesByTimelineId[timelineId] || EmptyArray;

    const dataNode = dp.collections.dataNodes.getById(dataNodeId); // dataNode must exist if summarized
    if (VerboseSumm && (!this.debugValueId || dataNode?.valueId === this.debugValueId) &&
      (isVisible || isSummarized || incomingEdges?.length)) {
      // eslint-disable-next-line max-len
      this.logger.debug(`Summarizing ${timelineId}, t=${targetNode?.timelineId}, vis=${isVisible}, summarized=${isSummarized}, incoming=${incomingEdges?.join(',')}`);
    }

    if (isVisible) {
      // node is (1) shown, (2) collapsed into `currentCollapsedAncestor` or (3) summarized
      nodeRouteMap.set(timelineId, new Set([targetNode]));

      for (const edgeId of incomingEdges) {
        const edge = this.og.edges[edgeId];
        const { from: fromOg, type } = edge;
        const allFrom = nodeRouteMap.get(fromOg);
        if (allFrom) {
          for (const from of allFrom) {
            if (from !== targetNode) {
              summaryState.addEdge(from, targetNode, type);
              if (VerboseSumm && (!this.debugValueId || dataNode?.valueId === this.debugValueId)) {
                this.logger.debug(`SUMM at ${timelineId}, new edge: ${from.timelineId} -> ${targetNode.timelineId}`);
              }
            }
          }
        }
      }
    }
    else {
      // node is hidden
      // → multicast all outgoing edges to all incoming edges
      // → to that end, add all `from`s to this node's `reroutes`
      /**
       * @type {Set.<DDGTimelineNode>}
       */
      let reroutes = new Set();
      for (const edgeId of incomingEdges) {
        const edge = this.og.edges[edgeId];
        const { from: fromOg, type } = edge;
        // TODO: summarize edge type correctly
        const allFrom = nodeRouteMap.get(fromOg);
        if (allFrom) {
          for (const from of allFrom) {
            reroutes.add(from);
          }
        }
      }
      if (reroutes.size) {
        nodeRouteMap.set(timelineId, reroutes);
      }
      // eslint-disable-next-line max-len
      if (VerboseSumm && (!this.debugValueId || dataNode?.valueId === this.debugValueId)) {
        reroutes.size && this.logger.debug(`SUMM at ${timelineId}, added re-routes:\n  ${Array.from(reroutes).map(n => `${n.timelineId} (${n.label})`).join(',')}`);
        // VerboseSumm && this.logger.debug(`SUMM at ${timelineId}, nodeRouteMap:\n  ${Array.from(nodeRouteMap.entries())
        //   .map(([timelineId, reroutes]) =>
        //     `${timelineId} → ${Array.from(reroutes).map(n => `${n.timelineId} (${n.label})`).join(',')}`).join('\n  ')}`);
      }
    }
  }

  /**
   * @param {DataNode} dataNode 
   * @param {DDGNodeSummary} nodeSummary
   * 
   * @return {DDGTimelineNode}
   */
  #lookupSummaryNode(dataNode, nodeSummary) {
    const accessedRefId = this.dp.util.getDataNodeAccessedRefId(dataNode.nodeId);
    if (accessedRefId) {
      // node is summarized by snapshot child node
      const { prop } = dataNode.varAccess;
      const snapshotId = nodeSummary.snapshotsByRefId.get(accessedRefId);
      if (snapshotId) {
        const snapshot = this.timelineNodes[snapshotId];
        const childId = snapshot.children[prop];
        return this.timelineNodes[childId];
      }
    }

    // node is summarized by some type of traceId
    const summarizingTraceId = this.#getSummarizingTraceId(dataNode.nodeId);
    const summarizingTimelineId = summarizingTraceId && nodeSummary.nodesByTid.get(summarizingTraceId);
    if (summarizingTimelineId) {
      return this.timelineNodes[summarizingTimelineId];
    }
    return null;
  }
}
