import last from 'lodash/last';
import groupBy from 'lodash/groupBy';
import TraceType, { isBeforeCallExpression, isTraceReturn } from '@dbux/common/src/types/constants/TraceType';
import { isTraceControlRolePush } from '@dbux/common/src/types/constants/TraceControlRole';
import DataNodeType, { isDataNodeModifyType, isDataNodeWrite } from '@dbux/common/src/types/constants/DataNodeType';
import ValueTypeCategory from '@dbux/common/src/types/constants/ValueTypeCategory';
// eslint-disable-next-line max-len
import DDGTimelineNodeType, { isDataTimelineNode, isLoopIterationTimelineNode, isLoopTimelineNode, isSnapshotTimelineNode } from '@dbux/common/src/types/constants/DDGTimelineNodeType';
// eslint-disable-next-line max-len
import { DDGTimelineNode, ContextTimelineNode, ValueTimelineNode, DataTimelineNode, TimelineRoot, RefSnapshotTimelineNode, GroupTimelineNode, BranchTimelineNode, IfTimelineNode, DecisionTimelineNode, IterationNode, RepeatedRefTimelineNode } from './DDGTimelineNodes';
import { makeContextLabel, makeTraceLabel } from '../helpers/makeLabels';
import DDGEdgeType from './DDGEdgeType';
import { controlGroupLabelMaker, branchSyntaxNodeCreators } from './timelineControlUtil';

/** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */
/** @typedef {import('@dbux/common/src/types/DataNode').default} DataNode */
/** @typedef {import('@dbux/common/src/types/RefSnapshot').ISnapshotChildren} ISnapshotChildren */
/** @typedef { Map.<number, number> } SnapshotMap */
/** @typedef {Map.<DataTimelineNode, { n: number }>} EdgeInfos */

// const Verbose = 1;
const Verbose = 0;

/** ###########################################################################
 * {@link DDGTimelineBuilder}
 *  #########################################################################*/

export default class DDGTimelineBuilder {
  /** ########################################
   * build-time datastructures
   *  ######################################*/

  /**
   * @type {GroupTimelineNode[]}
   */
  stack;

  /**
   * @type {DataTimelineNode[]}
   */
  skippedNodesByDataNodeId = [];

  /**
   * The last write of given accessId
   * or the first node that accessed the var (within bounds).
   * 
   * @type {Object.<number, DataTimelineNode>}
   */
  lastTimelineVarNodeByAccessId = {};


  /** ########################################
   * ctor
   *  ######################################*/

  /**
   * @param {import('./BaseDDG').default} ddg
   */
  constructor(ddg) {
    this.ddg = ddg;

    const timelineRoot = new TimelineRoot();
    this.ddg.addNode(timelineRoot);
    this.stack = [timelineRoot];
  }

  /** ###########################################################################
   * getters
   *  #########################################################################*/

  get dp() {
    return this.ddg.dp;
  }

  get logger() {
    return this.ddg.logger;
  }

  peekStack() {
    return last(this.stack);
  }

  peekStack1() {
    return this.stack[this.stack.length - 2];
  }

  getLastTimelineNodeByAccessId(accessId) {
    return this.lastTimelineVarNodeByAccessId[accessId];
  }

  getDataTimelineInputNode(dataNodeId) {
    // 1. look for skips
    let inputNode = this.skippedNodesByDataNodeId[dataNodeId];
    if (!inputNode) {
      // 2. DataNode was not skipped → get its DataTimelineNode
      inputNode = this.ddg.getFirstDataTimelineNodeByDataNodeId(dataNodeId);
    }
    return inputNode;
  }

  /** ###########################################################################
   * create and/or add nodes (basics)
   * ##########################################################################*/

  /**
   * hackfix: determine iteration counter (→ O(n^2) too costly for big graphs)
   */
  #getCurrentGroupIterationCount() {
    const group = this.peekStack();
    return group.children.filter(c => this.ddg.timelineNodes[c] instanceof IterationNode).length;
  }

  /**
   * Decision nodes are control nodes.
   * Inside of loops, they also serve as starting point for iterations.
   * 
   * @param {DataNode} dataNode 
   * @param {Trace} trace
   * @return {DecisionTimelineNode}
   */
  #addDecisionNode(dataNode, trace) {
    const { dp } = this;
    const currentGroup = this.peekStack();
    const staticTrace = dp.collections.staticTraces.getById(trace.staticTraceId);

    const label = this.ddg.makeDataNodeLabel(dataNode);
    const decisionNode = new DecisionTimelineNode(dataNode.nodeId, label);
    // hackfix: need to fix decisions
    //    NOTE: we don't add them, so they don't affect other data flow
    decisionNode.timelineId = this.ddg.decisionTimelineNodes.length;
    this.ddg.decisionTimelineNodes[decisionNode.timelineId] = decisionNode;
    // this.ddg.addDataNode(decisionNode);

    if (isLoopIterationTimelineNode(currentGroup.type)) {
      // continued iteration of loop

      this.#popGroup(); // pop previous iteration
      if (!this.#checkCurrentControlGroup(staticTrace, trace)) {
        // make sure, we are in the correct loop
        return null;
      }
      if (
        TraceType.is.BranchDecision(staticTrace.type) || // only used in case of `for (;;) { ... }`?
        dp.util.isDataNodeValueTruthy(dataNode.nodeId)   // else, loop decisions are always controlled by true/false values
      ) {
        // push next iteration
        const iterationNode = new IterationNode(decisionNode.timelineId, this.#getCurrentGroupIterationCount());
        iterationNode.label = this.peekStack().label + '#' + iterationNode.i;
        this.#addAndPushGroup(iterationNode, trace.traceId);
      }
    }
    else {
      if (!this.#checkCurrentControlGroup(staticTrace, trace)) {
        return null;
      }
      if (isLoopTimelineNode(currentGroup.type)) {
        // push first iteration of loop
        const iterationNode = new IterationNode(decisionNode.timelineId, this.#getCurrentGroupIterationCount());
        iterationNode.label = currentGroup.label + '#' + iterationNode.i;
        this.#addAndPushGroup(iterationNode, trace.traceId);
      }
      else {
        // non-loop branch
      }
      // TODO: fix decisions
      currentGroup.decisions.push(decisionNode.timelineId);
      // this.#addNodeToGroup(decisionNode);
    }
    return null;
    // return decisionNode;
  }

  /**
   * This is called on any snapshot or snapshot child node.
   * hackfix: add edges, but only during build, not during summarization
   * @param {DataTimelineNode} newNode 
   */
  addNestedSnapshotEdges(newNode) {
    if (!newNode.parentNodeId) {
      // skip in case of root nodes. Already handled in builder.
      return;
    }
    let dataNode = this.dp.util.getDataNode(newNode.dataNodeId);
    const edgeInfos = this.#gatherDataNodeEdges(dataNode, newNode);
    this.#addEdgeSet(newNode, edgeInfos);
  }

  /** ###########################################################################
   * add
   * ##########################################################################*/

  /**
   * @param {DataNode} dataNode
   */
  #addSnapshotOrDataNode(dataNode) {
    let newNode;

    if (this.#shouldBuildPartialSnapshot(dataNode)) {
      const { objectNodeId } = dataNode.varAccess;
      const dataNodes = this.dp.indexes.dataNodes.byTrace.get(dataNode.traceId);
      const partialChildren = dataNodes.filter(n => n.varAccess?.objectNodeId === objectNodeId);
      const refDataNode = this.dp.util.getDataNodeAccessedObjectNode(dataNode.nodeId);

      const snapshotsByRefId = new Map();
      newNode = this.ddg.addNewRefSnapshot(refDataNode, refDataNode.refId, snapshotsByRefId, null, partialChildren);
    }
    else if (this.#shouldBuildRootSnapshot(dataNode)) {
      const snapshotsByRefId = new Map();
      newNode = this.ddg.addNewRefSnapshot(dataNode, dataNode.refId, snapshotsByRefId, null);
    }
    else if (DataNodeType.is.Delete(dataNode.type)) {
      newNode = this.ddg.addDeleteEntryNode(dataNode, dataNode.varAccess?.prop || '');
    }
    else {
      // this is not a watched ref

      // if (dataNodes.length > 1) {
      //   // eslint-disable-next-line max-len
      //   this.logger.trace(`NYI: trace has multiple dataNodes but is not ref type (→ rendering first node as primitive) - at trace="${dp.util.makeTraceInfo(ownDataNode.traceId)}"`);
      // }
      newNode = this.ddg.addValueDataNode(dataNode);
    }

    // add to parent
    this.#addNodeToGroup(newNode);

    return newNode;
  }

  /**
   * @param {DDGTimelineNode} newNode 
   */
  #addNodeToGroup(newNode) {
    const group = this.peekStack();
    newNode.groupId = group.timelineId;
    group.children.push(newNode.timelineId);
  }

  /** ###########################################################################
   * branch logic
   * ##########################################################################*/



  /** ###########################################################################
   * {@link DDGTimelineBuilder#updateStack}
   * ##########################################################################*/

  /**
   * Check whether given group (supposedly the one on the top of the stack)
   * is controlled by given staticTrace.
   * 
   * @param {GroupTimelineNode} currentGroup 
   * @param {*} staticTrace 
   * @param {Trace} trace The trace of given staticTrace.
   */
  #checkCurrentControlGroup(staticTrace, trace) {
    const { dp } = this;
    const currentGroup = this.peekStack();
    if (currentGroup.controlStatementId !== staticTrace.controlId) {
      // sanity check
      const groupTag = `[${DDGTimelineNodeType.nameFrom(currentGroup.type)}]`;
      const groupControlInfo = `${currentGroup.controlStatementId && dp.util.makeStaticTraceInfo(currentGroup.controlStatementId)}`;
      this.logger.trace(`Invalid Control Group.\n  ` +
        `${trace && `At trace: ${dp.util.makeTraceInfo(trace)}` || ''}\n  ` +
        // eslint-disable-next-line max-len
        `Expected control group of: ${staticTrace.controlId && dp.util.makeStaticTraceInfo(staticTrace.controlId)},\n  ` +
        `Actual group: ${groupTag} ${groupControlInfo} (${JSON.stringify(currentGroup)})\n\n`
      );
      return false;
    }
    return true;
  }

  #makeGroupDebugTag(group) {
    return DDGTimelineNodeType.nameFrom(group.type);
  }

  #makeRecursiveGroupLabel(group, prev) {
    const ownLabel =
      controlGroupLabelMaker[group.type]?.(this.ddg, group) ||
      DDGTimelineNodeType.nameFrom(group.type).toLowerCase();
    const prevLabel = prev?.label;
    return (prevLabel ? `${prevLabel}#` : '') + ownLabel;
  }

  /**
   * Keep track of the stack.
   */
  updateStack(traceId) {
    const { ddg, dp } = this;
    const trace = dp.util.getTrace(traceId);
    const staticTrace = dp.util.getStaticTrace(traceId);
    if (TraceType.is.PushImmediate(staticTrace.type)) {
      // push context
      const context = dp.collections.executionContexts.getById(trace.contextId);
      const contextLabel = makeContextLabel(context, dp.application);
      this.#addAndPushGroup(new ContextTimelineNode(trace.contextId, contextLabel), traceId);
    }
    else if (isTraceControlRolePush(staticTrace.controlRole)) {
      // push branch statement
      const controlStatementId = staticTrace.controlId;
      const controlStaticTrace = dp.collections.staticTraces.getById(controlStatementId);
      const { syntax } = controlStaticTrace;
      const ControlGroupCtor = branchSyntaxNodeCreators[syntax];
      if (!ControlGroupCtor) {
        this.logger.trace(`BranchSyntaxNodeCreators does not exist for syntax=${syntax} at trace="${dp.util.makeStaticTraceInfo(staticTrace.staticTraceId)}"`);
      }
      else {
        const group = new ControlGroupCtor(controlStatementId);
        // update label on pop
        group.label = this.#makeRecursiveGroupLabel(group, this.peekStack());
        this.#addAndPushGroup(group, traceId);
      }
    }
    else if (dp.util.isTraceControlGroupPop(traceId)) {
      const currentGroup = this.peekStack();

      // sanity checks
      if (TraceType.is.PopImmediate(staticTrace.type)) {
        // context
        if (trace.contextId !== currentGroup.contextId) {
          this.logger.logTrace(`Invalid pop: expected context=${trace.contextId}, but got: ${currentGroup.toString()}`);
          return;
        }
      }
      else {
        if (isLoopIterationTimelineNode(currentGroup.type)) {
          this.#popGroup(); // when control group pops, current iteration also pops
        }
        if (!this.#checkCurrentControlGroup(staticTrace, trace)) {
          return;
        }
        // update label on pop
        currentGroup.label = this.#makeRecursiveGroupLabel(currentGroup, this.peekStack1());
      }
      this.#popGroup();
    }
  }

  /** ###########################################################################
   * {@link DDGTimelineBuilder#addTraceToTimeline}
   * ##########################################################################*/



  /** ###########################################################################
   * util
   * ##########################################################################*/

  /**
   * Take all DataNodes, then group and sort them by `objectNodeId`.
   * This is to deal with `{Object,Array}Expression` (and maybe other traces) where
   * one trace accesses multiple objects, and thus creates multiple snapshots.
   * The built snapshots are created greedily and might depend on one another, so
   * we need to assure the correct order.
   * @param {DataNode[]} dataNodes
   */
  #sortDataNodeGroups(dataNodes) {
    const byObjectNodeId = Object.entries(groupBy(dataNodes, n => n.varAccess?.objectNodeId || 0));

    /**
     * Order of DataNode groups:
     * 1. all Reads
     * 2. Compute, i.e. new object (Creates the snapshot. This is a hackfix: actual order of execution puts the object first.)
     * 3. all Writes (Writes might already have been consumed by (2) (if (2) exists) and thus might be "skipped")
     */
    // NOTE: Ascending order → Bigger number goes down.
    const ordering = {
      [DataNodeType.Read]: 1,
      [DataNodeType.Compute]: 2,
      [DataNodeType.ComputeWrite]: 2,
      [DataNodeType.Write]: 3
    };
    byObjectNodeId.sort((a, b) => {
      // hackfix: assume that first of group maps to first of other group
      const oa = ordering[a[1][0].type] || 0;
      const ob = ordering[b[1][0].type] || 0;
      return oa - ob;
    });
    return byObjectNodeId;
  }

  /**
   * NOTE: a trace might induce multiple {@link DDGTimelineNode} in these circumstances:
   *   1. if a DataNode reads or writes an object prop, we add the complete snapshot with all its children
   *   2. a Decision node that is also a Write Node (e.g. `if (x = f())`)
   */
  addTraceToTimeline(traceId) {
    const { dp/* , ddg: { bounds } */ } = this;
    const trace = dp.util.getTrace(traceId);
    // const dataNodesOfTrace = dp.util.getDataNodesOfTrace(traceId);
    const dataNodes = dp.indexes.dataNodes.byTrace.get(traceId);
    // const ownDataNode = trace.nodeId && dataNodes.find(dataNode => dataNode.nodeId === trace.nodeId);
    // const dataNode = trace.nodeId && dp.collections.dataNodes.getById(trace.nodeId);

    if (dataNodes?.length) {
      // [trace-datanode grouping heuristic]
      const byObjectNodeId = this.#sortDataNodeGroups(dataNodes);
      // dataNodes.length > 1 && console.debug('byObjectNodeId', 
      //   byObjectNodeId.map(entry => `${entry[0]} => ${entry[1].map(n => n.nodeId).join(',')}`).join('; ')
      // );
      for (const [, accessNodes] of byObjectNodeId) {
        for (let i = 0; i < accessNodes.length; ++i) {
        /* newNode = */ this.#addDataNodeToTimeline(accessNodes[i], trace);
        }
      }
    }
  }

  #gatherInputNodeEdge(toDataNodeId, inputDataNodeId, fromNodes) {
    const fromNode = this.getDataTimelineInputNode(inputDataNodeId);

    if (fromNode) {
      this.#gatherNodeEdge(toDataNodeId, fromNode, fromNodes);
    }
    else {
      // inputDataNodeId is ignored or external (are there other reasons?)
      // this.#shouldIgnoreDataNode(ownDataNode.nodeId)
    }
  }

  #gatherNodeEdge(toDataNodeId, fromNode, edgeInfos) {
    let edgeProps = edgeInfos.get(fromNode);
    if (!edgeProps) {
      edgeInfos.set(fromNode, edgeProps = { nByType: {} });
    }
    else {
      // → this edge has already been registered, meaning there are multiple connections between exactly these two nodes
    }
    const edgeType = this.ddg.getEdgeTypeOfDataNode(fromNode.dataNodeId, toDataNodeId);
    edgeProps.nByType[edgeType] = (edgeProps.nByType[edgeType] || 0) + 1;
  }

  #getIsDecision(dataNode) {
    const trace = this.dp.util.getTrace(dataNode.traceId);
    return this.dp.util.isTraceControlDecision(trace.traceId);
  }

  #addDataNodeToTimeline(dataNode, trace) {
    const { dp, ddg } = this;

    if (!dataNode) {
      // this.logger.logTrace(`NYI: trace did not have own DataNode: "${dp.util.makeTraceInfo(traceId)}"`);
      return null;
    }
    // Verbose && this.debug(`Adding Trace: t#${trace.traceId}, n#${dataNode.nodeId}, s#${trace.staticTraceId}, ${isDecision}`);

    // check for potential duplicates
    if (
      ddg.doesDataNodeHaveTimelineNode(dataNode.nodeId) &&
      !ddg.shouldDuplicateNode(dataNode.nodeId)
    ) {
      return null;
    }

    // ignore + skip logic
    if (!this.#processSkipAndIgnore(dataNode)) {
      return null;
    }

    /**
     * This is to avoid duplicate edges.
     * NOTE also that in JS, Sets retain order.
     * @type {EdgeInfos}
     */
    const edgeInfos = this.#gatherDataNodeEdges(dataNode, null);
    const isDecision = this.#getIsDecision(dataNode);

    let newNode;
    if (isDecision) {
      newNode = this.#addDecisionNode(dataNode, trace);
      if (!newNode) {
        return null;
      }
    }
    else {
      /**
       * Add new node.
       * NOTE: Don't add while still resolving connections above.
       * NOTE2: For now, don't skip adding since that causes issues with final node ordering.
       * @type {DataTimelineNode}
       */
      newNode = this.#addSnapshotOrDataNode(dataNode);
    }

    // bookkeeping for summaries
    const accessedRefId = dp.util.getDataNodeAccessedRefId(dataNode.nodeId);
    const varDeclarationTid = dataNode.varAccess?.declarationTid;

    newNode.hasSummarizableWrites = !!accessedRefId || !!varDeclarationTid;

    // update group
    const currentGroup = this.peekStack();
    currentGroup.hasSummarizableWrites ||= newNode.hasSummarizableWrites;

    // if (dataNode.refId === ?) {
    //   this.logger.debug(`Adding v${dataNode.refId} ${JSON.stringify(newNode)} - ${inputNodes.size} edges: `, Array.from(inputNodes.keys()).map(n => n.timelineId).join(', '));
    // }

    // add edges
    // if (isDataTimelineNode(newNode.type)) { // TODO: this will not be necessary once we fix `refNode`s
    this.#addEdgeSet(newNode, edgeInfos);
    // }
    return newNode;
  }

  /** ###########################################################################
   * edges
   * ##########################################################################*/

  /**
   * @param {DataNode} dataNode 
   * @param {DDGTimelineNode} newNode The node we are gathering for (if it already exists).
   * @param {EdgeInfos} edgeInfos 
   */
  #gatherDataNodeEdges(dataNode, newNode, edgeInfos = new Map()) {
    const prev = this.ddg.getLastDataTimelineNodeByDataNodeId(dataNode.nodeId, newNode);
    if (prev && isDataNodeModifyType(this.dp.util.getDataNodeType(prev.dataNodeId))) {
      // node was already added, and it was a modification → connect to that
      this.#gatherNodeEdge(dataNode.nodeId, prev, edgeInfos);
    }
    else {
      // → connect to inputs instead
      if (dataNode.valueFromId) {
        this.#gatherInputNodeEdge(dataNode.nodeId, dataNode.valueFromId, edgeInfos);
      }
      if (dataNode.inputs) {
        for (const inputDataNodeId of dataNode.inputs) {
          this.#gatherInputNodeEdge(dataNode.nodeId, inputDataNodeId, edgeInfos);
        }
      }
    }
    return edgeInfos;
  }

  /**
   * @param {DDGTimelineNode} dataNode 
   * @param {EdgeInfos} edgeInfos 
   */
  #addEdgeSet(toNode, edgeInfos) {
    for (const [inputNode, edgeProps] of edgeInfos) {
      this.ddg.addEdge(DDGEdgeType.Data, inputNode.timelineId, toNode.timelineId, edgeProps);
    }
  }

  /** ###########################################################################
   * stack util
   * ##########################################################################*/

  /**
   * @param {GroupTimelineNode} newGroup 
   */
  #addAndPushGroup(newGroup, pushTid) {
    newGroup.pushTid = pushTid;
    this.ddg.addNode(newGroup);
    this.#addNodeToGroup(newGroup);

    Verbose > 1 && this.debug(`PUSH ${this.#makeGroupDebugTag(newGroup)}`);
    this.stack.push(newGroup);
  }

  #popGroup() {
    const nestedGroup = this.stack.pop();
    Verbose > 1 && this.debug(`POP ${this.#makeGroupDebugTag(nestedGroup)}`);
    const currentGroup = this.peekStack();
    currentGroup.hasSummarizableWrites ||= nestedGroup.hasSummarizableWrites;
    return nestedGroup;
  }

  /** ###########################################################################
   * util
   *  #########################################################################*/

  debug(...args) {
    this.logger.debug(`${'  '.repeat(this.stack.length - 1).substring(1)}`, ...args);
  }


  /** ###########################################################################
   * Heuristics
   * ##########################################################################*/


  /**
   * If DataNode accesses an object, grab all DataNodes acessing the same object of same trace and
   * put them into one snapshot.
   */
  #shouldBuildPartialSnapshot(dataNode) {
    return (
      // ref access
      !!dataNode.varAccess?.objectNodeId &&
      // ignore trace owning nodes (since that causes some trouble)
      !this.dp.util.isTraceOwnDataNode(dataNode.nodeId) &&
      // don't create partial snapshots for watched nodes.
      //    (→ since this would lead to duplicated nodes)
      //    → create full/deep snapshots instead
      !this.ddg.watchSet.isWatchedDataNode(dataNode.nodeId)
    );
  }

  /**
   * 
   * @param {DataNode} dataNode 
   */
  #shouldBuildRootSnapshot(dataNode) {
    return this.ddg.shouldBuildDeepSnapshotRoot(dataNode);
  }

  /** ###########################################################################
   * skip + ignore (also heuristics)
   * ##########################################################################*/

  #canSkipOrIgnore(dataNode) {
    return !this.#getIsDecision(dataNode);
  }

  shouldIgnoreDataNode(dataNodeId) {
    if (this.ddg.watchSet.isWatchedDataNode(dataNodeId)) {
      return false;
    }
    const trace = this.dp.util.getTraceOfDataNode(dataNodeId);
    if (trace) {
      const { traceId } = trace;
      const dataNode = this.dp.util.getDataNode(dataNodeId);
      const traceType = this.dp.util.getTraceType(traceId);
      if (TraceType.is.Declaration(traceType) && !dataNode.inputs) {
        // ignore declaration-only nodes
        // → connect to writes only
        return true;
      }
      if (dataNode.refId) {
        const valRef = this.dp.collections.values.getById(dataNode.refId);
        if (ValueTypeCategory.is.Function(valRef?.category)) {
          // ignore functions for now (JSA has plenty of cluttering callback movement)
          return true;
        }
      }
    }
    return false;
  }

  shouldSkipDataNode(dataNodeId) {
    const { dp } = this;

    // NOTE: this logic is not ideal. Single-input Compute nodes will not show, but multi-input Compute nodes will.
    // future-work: proper, dedicated Compute merge logic (maybe in summarizer tho)
    const dataNode = dp.util.getDataNode(dataNodeId);

    if (this.ddg.watchSet.isWatchedDataNode(dataNodeId)) {
      // [watch-skip heuristic]
      // [evil] this heuristic is a constant pain point
      //   → problem w/ `return [a, b]` etc:
      //      1. either the reads will get their own nodes here
      //      2. or Write children are skipped and then not nested
      //   → Consider moving the DataNodes from BCE to CER

      // Don't skip watched nodes...
      //  ...unless its a ref child read.
      //  → Watched read children might get skipped otherwise.
      return !!dataNode.varAccess?.objectNodeId && !isDataNodeWrite(dataNode.type);
    }

    if (DataNodeType.is.Delete(dataNode.type)) {
      // don't skip deletes
      return false;
    }

    if (dp.util.isDataNodePassAlong(dataNodeId)) {
      // skip all "pass along" nodes

      return DataNodeType.is.Read(dataNode.type);
      // return !isDataNodeModifyType(dataNode.type);
      // return DataNodeType.is.Read(dataNode.type) ||
      // !dp.util.isTraceOwnDataNode(dataNodeId); // nested modify "pass-along" node (e.g. from `x` in `[x,y]` or the writes of a `push` call etc.)
    }
    return false;
  }

  getIgnoreAndSkipInfo(dataNode) {
    if (!this.#canSkipOrIgnore(dataNode)) {
      return null;
    }

    const ignore = this.shouldIgnoreDataNode(dataNode.nodeId);
    const skippedBy = this.getSkippedByNode(dataNode);
    if (!ignore &&
      (!skippedBy ||
        // it might seem as "skipped by itself" 
        //    because shouldSkip is true but originally, 
        //    there was no node to skip to → ignore
        skippedBy.dataNodeId === dataNode.nodeId
      )
    ) {
      return null;
    }
    return {
      ignore,
      skippedBy
    };
  }

  #processSkipAndIgnore(dataNode) {
    // TODO: allow for decision skips as well?
    if (this.#canSkipOrIgnore(dataNode)) {
      if (this.shouldIgnoreDataNode(dataNode.nodeId)) {
        // ignore entirely
        Verbose > 1 && this.logger.debug(`IGNORE`, this.ddg.makeDataNodeLabel(dataNode));
        return false;
      }
      const skippedBy = this.getSkippedByNode(dataNode);
      if (skippedBy) {
        // → This node SHOULD be skipped and CAN be skipped.
        // → register skip node
        // Any outgoing edge should be connected to `skippedBy` instead of `ownDataNode`.
        this.skippedNodesByDataNodeId[dataNode.nodeId] = skippedBy;
        return false;
      }
    }
    return true;
  }


  /**
   * Check if given `dataNode` should be skipped.
   * If so, find and return the last {@link DDGTimelineNode} of same `inputDataNode`'s `accessId`.
   * 
   * @param {DataNode} dataNode
   * @return {DDGTimelineNode}
   */
  getSkippedByNode(dataNode) {
    if (!this.shouldSkipDataNode(dataNode.nodeId)) {
      return null;
    }

    // TODO: a previous TimelineNode exists, but only if not skipped
    //    → look up previous TimelineNode → if found: return it!
    //    → else take a step on the underlying DFG instead, then lookup TimelineNode of that → if found: return it!
    //    → then repeat

    /**
     * @type {DataNode}
     */
    let prev = null;
    // → look-up input
    if (dataNode.valueFromId) {
      prev = this.getDataTimelineInputNode(dataNode.valueFromId);
    }
    if (!prev) {
      if (dataNode.accessId) {
        prev = this.getLastTimelineNodeByAccessId(dataNode.accessId);
      }
    }
    if (prev && this.ddg.VerboseAccess) {
      this.ddg.logger.debug(`Skip: n${dataNode.nodeId} by ${prev.timelineId} (n${prev.dataNodeId}), accessId=${dataNode.accessId}`);
    }
    // if (!prev) {
    //   this.logger.trace(`[skipInputDataNode] could not lookup input for (declaration?) DataNode at trace="${this.dp.util.getTraceOfDataNode(dataNode.nodeId)}"`);
    // }
    return prev;
  }
}
