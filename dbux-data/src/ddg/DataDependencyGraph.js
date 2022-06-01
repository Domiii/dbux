import EmptyArray from '@dbux/common/src/util/EmptyArray';
import Enum from '@dbux/common/src/util/Enum';
import { isTraceReturn } from '@dbux/common/src/types/constants/TraceType';
import RefSnapshot from '@dbux/common/src/types/RefSnapshot';
import { typedShallowClone } from '@dbux/common/src/util/typedClone';
// eslint-disable-next-line max-len
import DDGTimelineNodeType, { isRepeatedRefTimelineNode, isControlGroupTimelineNode, isDataTimelineNode, isDecisionNode, isLoopIterationTimelineNode, isLoopTimelineNode, isSnapshotTimelineNode } from '@dbux/common/src/types/constants/DDGTimelineNodeType';
import { RootTimelineId } from './constants';
import BaseDDG from './BaseDDG';
import { EdgeState } from './DDGEdge';
import DDGSummaryMode, { isSummaryMode, isCollapsedMode, isShownMode } from './DDGSummaryMode';
import ddgQueries from './ddgQueries';
import DDGEdgeType from './DDGEdgeType';
import DDGNodeSummary from './DDGNodeSummary';
// eslint-disable-next-line max-len
import { DDGTimelineNode, ContextTimelineNode, ValueTimelineNode, DataTimelineNode, TimelineRoot, RefSnapshotTimelineNode, GroupTimelineNode, BranchTimelineNode, IfTimelineNode, DecisionTimelineNode, IterationNode, RepeatedRefTimelineNode } from './DDGTimelineNodes';
import { makeTraceLabel } from '../helpers/makeLabels';

/** ###########################################################################
 * default config
 * ##########################################################################*/

// const RootDefaultSummaryMode = {
// };
const RootDefaultSummaryMode = DDGSummaryMode.ExpandSelf;
// const RootDefaultSummaryMode = DDGSummaryMode.HideChildren;

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

  get isBuilding() {
    return BuildStage.is.Building(this.buildStage);
  }

  get isSummarizing() {
    return BuildStage.is.Summarizing(this.buildStage);
  }

  /** ###########################################################################
   * public control methods
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

  /**
   * During initial build, not all details of every node are prepared.
   * When investigating a node's details, this function needs to run first.
   */
  #buildNodeSummary(timelineId) {
    this.#buildNodeSummarySnapshots(timelineId);
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
    this.buildStage = BuildStage.Building;
    try {
      this.og.build(watchTraceIds);
    }
    finally {
      this.buildStage = BuildStage.None;
    }

    this.buildStage = BuildStage.Summarizing;
    try {
      this.#initSummaryConfig();
      this.#applySummarization();
    }
    finally {
      this.buildStage = BuildStage.None;
    }
  }

  /** ###########################################################################
   * more reset + init stuff
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
   * TODO: move all the below to `BaseDDG`
   * ##########################################################################*/

  getDataTimelineInputNode(dataNodeId) {
    // 1. look for skips
    let inputNode = this.skippedNodesByDataNodeId[dataNodeId];
    if (!inputNode) {
      // 2. DataNode was not skipped → get its DataTimelineNode
      inputNode = this.getFirstDataTimelineNodeByDataNodeId(dataNodeId);
    }
    return inputNode;
  }

  getFirstDataTimelineNodeByDataNodeId(dataNodeId) {
    return this.firstTimelineDataNodeByDataNodeId[dataNodeId];
  }

  /** ###########################################################################
   * snapshots
   *  #########################################################################*/

  /**
   * 
   * @param {RefSnapshotTimelineNode} parentSnapshot 
   * @param {ISnapshotChildren} originalChildren 
   * @param {DataNode[]} modificationDataNodes 
   * @param {boolean} isOriginalValueRef We call this function in two different flavors: with ValueRef.children or with TimelineNode.children
   */
  #addSnapshotChildren(parentSnapshot, originalChildren, modificationDataNodes, isOriginalValueRef, snapshotsByRefId) {
    /**
     * @type {Object.<string, DataNode>}
     */
    const lastModsByProp = {};

    for (const dataNode of modificationDataNodes) {
      lastModsByProp[dataNode.varAccess.prop] = dataNode;
    }

    const allProps = [
      ...Object.keys(lastModsByProp),
      ...Object.keys(originalChildren)
    ];

    // create children
    parentSnapshot.children = new originalChildren.constructor();
    for (const prop of allProps) {
      const lastModDataNode = lastModsByProp[prop];
      /**
       * @type {DDGTimelineNode}
       */
      let newChild;
      if (!lastModDataNode) {
        // initial value
        /**
         * @type {RefSnapshot | number | any}
         */
        const original = originalChildren[prop];
        if (isOriginalValueRef) {
          // original is ValueRef
          if (original.refId) {
            // nested ref
            // PROBLEM: the children of nested initial reference values are not addressable
            //      → because they cannot have a unique `accessId`!!
            //      → meaning that their root ValueRef's dataNode is accessed instead of `original`.
            // throw new Error('NYI: nested initial reference types are currently not supported');
            return;
          }
          else {
            // NOTE: this happens with commonly used globals (such as console.log)
            // primitive
            // PROBLEM: this value does not have a unique `dataNode` (but is addressable)
            // TODO: might need some addressing method using its parent (just like `varAccess`)
            // throw new Error('NYI: nested initial primitive value');
            return;
          }
        }
        else {
          // original is timelineId
          newChild = this.#deepCloneNode(original, snapshotsByRefId);
        }
      }
      else {
        // apply lastMod
        // if (this.#canBeRefSnapshot(lastModDataNode)) {
        if (lastModDataNode.refId) {
          // nested ref (→ the child's written value is a ref)
          newChild = this.addNewRefSnapshot(lastModDataNode, lastModDataNode.refId, snapshotsByRefId, parentSnapshot);
        }
        else {
          // primitive
          const fromNode = this.getDataTimelineInputNode(lastModDataNode.nodeId);
          newChild = this.addValueDataNode(lastModDataNode);
          if (fromNode && !this.isSummarizing) {
            // add edges, but not during summarization
            // TODO: determine correct DDGEdgeType
            const edgeType = DDGEdgeType.Data;
            const edgeState = { nByType: { [edgeType]: 1 } };
            this.addEdge(edgeType, fromNode.timelineId, newChild.timelineId, edgeState);
          }
        }
      }
      newChild.parentNodeId = parentSnapshot.timelineId;
      parentSnapshot.children[prop] = newChild.timelineId;
    }
  }

  /**
   * Clone a node of the exact same `dataNodeId`
   * 
   * @param {*} timelineId
   * @param {SnapshotMap?} snapshotsByRefId
   */
  #deepCloneNode(timelineId, snapshotsByRefId) {
    const originalNode = this.timelineNodes[timelineId];

    let cloned;
    if (isDataTimelineNode(originalNode.type)) {
      // original was data node (probably primitive)
      cloned = typedShallowClone(originalNode);
      this.addDataNode(cloned);
    }
    else if (isRepeatedRefTimelineNode(originalNode.type)) {
      cloned = typedShallowClone(originalNode);
      this.addNode(cloned);
    }
    else if (isSnapshotTimelineNode(originalNode.type)) {
      cloned = this.#deepCloneSnapshot(timelineId, snapshotsByRefId);
    }
    else {
      throw new Error(`NYI: cannot clone group or decision nodes - ${DDGTimelineNodeType.nameFrom(originalNode.type)}`);
    }
    return cloned;
  }

  #deepCloneSnapshot(timelineId, snapshotsByRefId) {
    const originalNode = this.timelineNodes[timelineId];
    const cloned = typedShallowClone(originalNode);

    // original was nested snapshot
    this.#addRefSnapshotNode(cloned, snapshotsByRefId);

    if (originalNode.children) {
      // → keep cloning
      this.#addSnapshotChildren(cloned, originalNode.children, EmptyArray, false, snapshotsByRefId);
    }
    return cloned;
  }

  /**
   * @param {RefSnapshotTimelineNode} snapshot 
   * @param {SnapshotMap?} snapshotsByRefId
   */
  #addRefSnapshotNode(snapshot, snapshotsByRefId) {
    this.addNode(snapshot);
    snapshotsByRefId?.set(snapshot.refId, snapshot);
  }

  /**
   * Check whether `refId` exists in `snapshotsByRefId` as an independent root.
   * To that end:
   * 1. It must exist as a root and
   * 2. Its parent is not a descendant of that root
   */
  #isSnapshotIndependentRoot(snapshot, parentSnapshot) {
    const isRoot = !snapshot.parentNodeId;
    if (isRoot && !ddgQueries.isSnapshotDescendant(this, snapshot, parentSnapshot)) {
      return true;
    }
    return false;
  }

  /**
   * @param {DataNode} ownDataNode 
   * @param {number} refId The refId of the snapshot. For roots, this is `getDataNodeAccessedRefId`, while for children and certain watched roots, it is {@link DataNode.refId}.
   * @param {SnapshotMap?} snapshotsByRefId If provided, it helps keep track of all snapshots of a set.
   * @param {RefSnapshotTimelineNode?} parentSnapshot
   * 
   * @return {RefSnapshotTimelineNode}
   */
  addNewRefSnapshot(ownDataNode, refId, snapshotsByRefId, parentSnapshot) {
    const { dp } = this;

    if (!refId) {
      throw new Error(`missing refId in dataNode: ${JSON.stringify(ownDataNode, null, 2)}`);
    }

    // handle circular refs (or otherwise repeated refs in set)
    const snapshotOfRef = snapshotsByRefId.get(refId);
    if (snapshotOfRef) {
      // this ref already has a snapshot in set
      if (snapshotsByRefId.size > 1 && this.#isSnapshotIndependentRoot(snapshotOfRef, parentSnapshot)) {
        // NOTE: no need to check, if there is only one root
        // → independent root: we can freely move node from root position to this parent instead
        return snapshotOfRef;
      }

      // if circular or otherwise repeated → add repeater node
      return new RepeatedRefTimelineNode(ownDataNode.traceId, ownDataNode.nodeId, refId, snapshotOfRef.timelineId);
    }

    const existingSnapshot = this._refSnapshotsByDataNodeId[ownDataNode.nodeId];
    if (existingSnapshot) {
      // clone existing snapshot
      return this.#deepCloneNode(existingSnapshot.timelineId, snapshotsByRefId);
    }

    /**
     * Create new
     */
    const snapshot = new RefSnapshotTimelineNode(ownDataNode.traceId, ownDataNode.nodeId, refId);
    snapshot.label = this.makeDataNodeLabel(ownDataNode);
    this.#addRefSnapshotNode(snapshot, snapshotsByRefId);

    /**
     * → build new snapshot.
     * NOTE: this is loosely based on {@link dp.util.constructVersionedValueSnapshot}.
     */
    const valueRef = this.dp.collections.values.getById(refId);

    // get last modifications by prop
    const fromTraceId = 0;  // → since we are not building upon a previous snapshot, we have to collect everything from scratch
    const toTraceId = ownDataNode.traceId;
    const modificationDataNodes = dp.util.collectDataSnapshotModificationNodes(refId, fromTraceId, toTraceId);
    this.#addSnapshotChildren(snapshot, valueRef.children, modificationDataNodes, true, snapshotsByRefId);

    // TODO: add refNode edge!

    // }
    // else {
    //   /**
    //    * → deep clone previous snapshot.
    //    */
    //   const fromTraceId = previousSnapshot.traceId;
    //   const toTraceId = ownDataNode.traceId;
    //   const modificationDataNodes = dp.util.collectDataSnapshotModificationNodes(refId, fromTraceId, toTraceId);
    //   // const modificationDataNodes = dataNodesOfTrace;
    //   this.#addSnapshotChildren(snapshot, previousSnapshot.children, modificationDataNodes, false);
    // }

    // snapshot.hasRefWriteNodes = true;
    this._refSnapshotsByDataNodeId[snapshot.dataNodeId] = snapshot;

    return snapshot;
  }

  /**
   * @param {number} timelineId
   */
  #buildNodeSummarySnapshots(timelineId) {
    const { dp } = this;
    const node = this._timelineNodes[timelineId];
    if (!node.hasRefWriteNodes || this.nodeSummaries[timelineId]) {
      // already built or nothing to build
      return;
    }

    const lastModifyNodesByRefId = new Map();
    const lastNestedDataNodeId = this.#collectNestedUniqueRefTrees(node, lastModifyNodesByRefId);

    /**
     * @type {SnapshotMap}
     */
    const snapshotsByRefId = new Map();
    for (const [refId, dataNodeId] of lastModifyNodesByRefId) {
      if (this._lastAccessDataNodeIdByRefId[refId] <= lastNestedDataNodeId) {
        // skip: this ref is only used internally (or before) this node. It is not accessed AFTER this node
        continue;
      }
      if (snapshotsByRefId.has(refId)) {
        // skip: this ref was already added as a descendant of a previous ref
        continue;
      }
      const dataNode = dp.collections.dataNodes.getById(dataNodeId);
      this.addNewRefSnapshot(dataNode, refId, snapshotsByRefId, null);
    }

    const roots = Array.from(snapshotsByRefId.values()).filter(snap => !snap.parentNodeId);

    // done → set `summaryNodes` to be only the roots of this set
    const summaryNodes = roots;
    this.nodeSummaries[timelineId] = new DDGNodeSummary(timelineId, snapshotsByRefId, summaryNodes);
  }

  /**
   * Finds all nested modified `refId`s nested in the given node and its descendants.
   * 
   * @param {DDGTimelineNode} node
   * @param {Map.<number, number>} lastModifyNodesByRefId
   * @return {number} The `lastDataNodeId` of the entire node.
   */
  #collectNestedUniqueRefTrees(node, lastModifyNodesByRefId) {
    const { dp } = this;
    let lastDataNodeId = node.dataNodeId;
    if (node.dataNodeId) {
      const refId = dp.util.getDataNodeModifyingRefId(node.dataNodeId);
      if (refId) {
        lastModifyNodesByRefId.set(refId, node.dataNodeId);
      }
    }
    if (node.children) {
      for (const childId of Object.values(node.children)) {
        const childNode = this.timelineNodes[childId];
        const lastChildDataNodeId = this.#collectNestedUniqueRefTrees(childNode, lastModifyNodesByRefId);
        if (lastChildDataNodeId) {
          lastDataNodeId = lastChildDataNodeId;
        }
      }
    }
    return lastDataNodeId;
  }

  /** ###########################################################################
   * node methods
   *  #########################################################################*/

  /**
   * @param {DataNode} dataNode 
   * @return {ValueTimelineNode}
   */
  addValueDataNode(dataNode) {
    const label = this.makeDataNodeLabel(dataNode);
    const newNode = new ValueTimelineNode(dataNode.nodeId, label);

    this.addDataNode(newNode);

    return newNode;
  }

  /**
   * @param {DataTimelineNode} newNode 
   */
  addDataNode(newNode) {
    const { dp } = this;
    this.addNode(newNode);
    this.firstTimelineDataNodeByDataNodeId[newNode.dataNodeId] ||= newNode;
    newNode.hasRefNodes = !!dp.util.getDataNodeModifyingRefId(newNode.dataNodeId);
  }

  /** ###########################################################################
   * labels
   * ##########################################################################*/

  makeDataNodeLabel(dataNode) {
    const { dp } = this;
    const { nodeId: dataNodeId, traceId } = dataNode;

    // get trace data
    const { staticTraceId, nodeId: traceNodeId } = this.dp.collections.traces.getById(traceId);
    const isTraceOwnDataNode = traceNodeId === dataNodeId;
    const ownStaticTrace = isTraceOwnDataNode && this.dp.collections.staticTraces.getById(staticTraceId);
    const isNewValue = !!ownStaticTrace?.dataNode?.isNew;

    // variable name
    let label = '';
    if (dataNode.traceId) {
      // NOTE: staticTrace.dataNode.label is used for `Compute` (and some other?) nodes
      label = ownStaticTrace.dataNode?.label;
    }

    if (!label) {
      const varName = dp.util.getDataNodeDeclarationVarName(dataNodeId);
      if (!isNewValue && varName) {
        label = varName;
      }
      else if (isTraceReturn(ownStaticTrace.type)) {
        // return label
        label = 'ret';
      }
    }

    if (!label) {
      if (dp.util.isTraceOwnDataNode(dataNodeId)) {
        // default trace label
        const trace = dp.util.getTrace(dataNode.traceId);
        label = makeTraceLabel(trace);
      }
      else {
        // TODO: ME
      }
    }
    // else {
    // }

    // TODO: nested DataNodes don't have a traceId (or they don't own it)
    return label;
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
    [DDGSummaryMode.ExpandSelf]: (timelineId) => {
      const { og } = this;
      const node = og.timelineNodes[timelineId];

      // collapse all children
      for (const childId of node.children) {
        const childNode = og.timelineNodes[childId];
        const targetMode = ddgQueries.canApplySummaryMode(childNode, DDGSummaryMode.Collapse) ?
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
      this.propagateSummaryMode[mode](timelineId);
    }
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

    let isVisible = !currentCollapsedAncestor && ddgQueries.isVisible(this, node);
    const isCollapsed = !currentCollapsedAncestor && ddgQueries.isCollapsed(this, node);
    const needsSummaryData = !currentCollapsedAncestor && ddgQueries.isNodeSummarized(this, node);
    let targetNode = currentCollapsedAncestor || node;
    let isSummarized = ddgQueries.isNodeSummarized(this, targetNode);

    // prep
    if (needsSummaryData) {
      // build node summary (if not already built)
      this.#buildNodeSummary(timelineId);
    }

    // DFS recursion
    if (children) {
      // node has children
      if (isCollapsed) {
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

    // prep summary
    let nodeSummary;
    if (isSummarized) {
      nodeSummary = this.nodeSummaries[targetNode.timelineId];
      isSummarized = !!nodeSummary?.summaryNodes?.length;
      if (isSummarized) {
        const dataNode = dp.collections.dataNodes.getById(dataNodeId); // dataNode must exist if summarized
        // link to summaryNode instead of `targetNode`
        targetNode = this.#lookupSummaryNode(dataNode, nodeSummary);
        if (!targetNode) {
          // NOTE: we simply "hide" nodes that are not in `summaryNodes`
          // → meaning, we "propagate" its edges
          isVisible = false;
        }
      }
    }

    // add/merge incoming edges
    const incomingEdges = this.og.inEdgesByTimelineId[timelineId] || EmptyArray;

    if (isVisible || currentCollapsedAncestor) {
      // node is (1) shown, (2) collapsed into `currentCollapsedAncestor` or (3) summarized
      nodeRouteMap.set(timelineId, [targetNode]);

      for (const edgeId of incomingEdges) {
        const edge = this.og.edges[edgeId];
        const { from: fromOg, type } = edge;
        const allFrom = nodeRouteMap.get(fromOg);
        if (allFrom) {
          for (const from of allFrom) {
            if (from !== targetNode) {
              // TODO: deal w/ duplicate edges
              summaryState.addEdge(from, targetNode, type);
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
        // TODO: summarize edge type correctly
        const allFrom = nodeRouteMap.get(fromOg);
        if (allFrom) {
          for (const from of allFrom) {
            reroutes.push(from);
          }
        }
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
    const refId = this.dp.util.getDataNodeAccessedRefId(dataNode);
    if (refId) {
      const { prop } = dataNode.varAccess;
      const snapshot = nodeSummary.snapshotsByRefId[refId];
      const childId = snapshot.children[prop];
      return this.timelineNodes[childId];
    }
    return null;
  }
}
