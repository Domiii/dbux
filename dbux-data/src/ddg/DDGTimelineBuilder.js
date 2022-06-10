import last from 'lodash/last';
import TraceType, { isBeforeCallExpression, isTraceReturn } from '@dbux/common/src/types/constants/TraceType';
import { isTraceControlRolePush } from '@dbux/common/src/types/constants/TraceControlRole';
import DataNodeType, { isDataNodeModifyType } from '@dbux/common/src/types/constants/DataNodeType';
// eslint-disable-next-line max-len
import DDGTimelineNodeType, { isDataTimelineNode, isLoopIterationTimelineNode, isLoopTimelineNode, isSnapshotTimelineNode } from '@dbux/common/src/types/constants/DDGTimelineNodeType';
// eslint-disable-next-line max-len
import { DDGTimelineNode, ContextTimelineNode, ValueTimelineNode, DataTimelineNode, TimelineRoot, RefSnapshotTimelineNode, GroupTimelineNode, BranchTimelineNode, IfTimelineNode, DecisionTimelineNode, IterationNode, RepeatedRefTimelineNode } from './DDGTimelineNodes';
import { makeContextLabel, makeTraceLabel } from '../helpers/makeLabels';
import DDGEdgeType from './DDGEdgeType';
import { controlGroupLabelMaker, branchSyntaxNodeCreators } from './timelineControlUtil';
import ValueTypeCategory from '@dbux/common/src/types/constants/ValueTypeCategory';

/** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */
/** @typedef {import('@dbux/common/src/types/DataNode').default} DataNode */
/** @typedef {import('@dbux/common/src/types/RefSnapshot').ISnapshotChildren} ISnapshotChildren */
/** @typedef { Map.<number, number> } SnapshotMap */

const Verbose = 1;
// const Verbose = 0;

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
  addDecisionNode(dataNode, trace) {
    const { dp } = this;
    const currentGroup = this.peekStack();
    const staticTrace = dp.collections.staticTraces.getById(trace.staticTraceId);

    const label = this.ddg.makeDataNodeLabel(dataNode);
    const decisionNode = new DecisionTimelineNode(dataNode.nodeId, label);
    this.ddg.addDataNode(decisionNode);

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
        this.#addAndPushGroup(iterationNode, trace.traceId);
      }
      else {
        // non-loop branch
        currentGroup.decisions.push(decisionNode.timelineId);
      }
    }
    return decisionNode;
  }

  /**
   * hackfix: add edges, but only during build, not during summarization
   * @param {DataTimelineNode} newNode 
   */
  onNewSnapshotNode(newNode) {
    const fromNode = this.getDataTimelineInputNode(newNode.dataNodeId);
    if (
      fromNode
    ) {
      this.ddg.addSnapshotEdge(fromNode, newNode);
    }
  }

  /** ###########################################################################
   * skip + ignore
   * ##########################################################################*/

  getIgnoreAndSkipInfo(dataNode) {
    const ignore = this.shouldIgnoreDataNode(dataNode.nodeId);
    const skippedBy = this.getSkippedByDataNode(dataNode);
    if (!ignore && !skippedBy) {
      return null;
    }
    return {
      ignore,
      skippedBy
    };
  }

  #processSkipAndIgnore(dataNode, isDecision) {
    // TODO: allow for decision skips as well
    if (!isDecision && !this.ddg.watchSet.isWatchedDataNode(dataNode.nodeId)) {
      if (this.shouldIgnoreDataNode(dataNode.nodeId)) {
        // ignore entirely
        Verbose > 1 && this.logger.debug(`IGNORE`, this.ddg.makeDataNodeLabel(dataNode));
        return false;
      }
      const skippedBy = this.getSkippedByDataNode(dataNode);
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

  shouldIgnoreDataNode(dataNodeId) {
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

    if (dp.util.isDataNodePassAlong(dataNodeId)) {
      // skip all "pass along" nodes
      const dataNode = dp.util.getDataNode(dataNodeId);

      return !isDataNodeModifyType(dataNode.type) || // Read or Compute
        !dp.util.isTraceOwnDataNode(dataNodeId); // nested modify "pass-along" node (e.g. from `x` in `[x,y]` or the writes of a `push` call etc.)
    }
    return false;
  }

  /**
   * Check if given `dataNode` should be skipped.
   * If so, find and return the last {@link DDGTimelineNode} of same `inputDataNode`'s `accessId`.
   * 
   * @param {DataNode} dataNode
   * @return {DDGTimelineNode}
   */
  getSkippedByDataNode(dataNode) {
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
      prev =
        this.skippedNodesByDataNodeId[dataNode.valueFromId] ||
        this.ddg.getFirstDataTimelineNodeByDataNodeId(dataNode.valueFromId);
    }
    if (!prev) {
      if (dataNode.accessId) {
        prev = this.getLastTimelineNodeByAccessId(dataNode.accessId);
      }
    }
    // if (!prev) {
    //   this.logger.trace(`[skipInputDataNode] could not lookup input for (declaration?) DataNode at trace="${this.dp.util.getTraceOfDataNode(dataNode.nodeId)}"`);
    // }
    return prev;
  }

  /**
   * 
   */
  #addSnapshotOrDataNode(dataNode) {
    let newNode;
    if (this.#shouldCreateSnapshot(dataNode)) {
      const snapshotsByRefId = new Map();
      newNode = this.ddg.addNewRefSnapshot(dataNode, dataNode.refId, snapshotsByRefId, null);
    }
    else {
      // this is not a watched ref

      // if (dataNodes.length > 1) {
      //   // eslint-disable-next-line max-len
      //   this.logger.trace(`NYI: trace has multiple dataNodes but is not ref type (→ rendering first node as primitive) - at trace="${dp.util.makeTraceInfo(ownDataNode.traceId)}"`);
      // }
      newNode = this.ddg.addValueDataNode(dataNode);
    }

    if (dataNode.accessId && (
      isDataNodeModifyType(dataNode.type) ||
      !this.lastTimelineVarNodeByAccessId[dataNode.accessId]
    )) {
      // register node by var
      this.lastTimelineVarNodeByAccessId[dataNode.accessId] = newNode;
    }

    // add to parent
    this.#addNodeToGroup(newNode);

    return newNode;
  }

  /**
   * @param {DDGTimelineNode} newNode 
   */
  #addNodeToGroup(newNode) {
    const parent = this.peekStack();
    parent.children.push(newNode.timelineId);
  }

  /** ###########################################################################
   * snapshots
   * ##########################################################################*/

  /**
   * NOTE: we always want to generate snapshots, to actually grab all meaningful writes.
   * If we want to render less snapshots, that should be done by summarization.
   * 
   * @param {DataNode} dataNode 
   */
  #shouldCreateSnapshot(dataNode) {
    return !!dataNode.refId;
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

  #makeGroupLabel(group) {
    return controlGroupLabelMaker[group.type]?.(this.ddg, group) || '';
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
        group.label = this.#makeGroupLabel(group);
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
        currentGroup.label = this.#makeGroupLabel(currentGroup);
      }
      this.#popGroup();
    }
  }

  /** ###########################################################################
   * {@link DDGTimelineBuilder#addTraceToTimeline}
   * ##########################################################################*/

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
      let newNode = this.#addDataNodeToTimeline(dataNodes[0], trace);
      if (newNode && isSnapshotTimelineNode(newNode.type)) {
        // TODO: also add all DataNodes that do not belong to given snapshot
      }
      else {
        for (let i = 1; i < dataNodes.length; ++i) {
          /* newNode = */ this.#addDataNodeToTimeline(dataNodes[i], trace);
        }
      }
    }
  }

  #addInputNodeEdge(inputDataNodeId, inputNodes) {
    const inputNode = this.getDataTimelineInputNode(inputDataNodeId);

    if (inputNode) {
      let edgeProps = inputNodes.get(inputNode);
      if (!edgeProps) {
        inputNodes.set(inputNode, edgeProps = { nByType: {} });
      }
      else {
        // → this edge has already been registered, meaning there are multiple connections between exactly these two nodes
      }
      // TODO: geet correct edgeType
      const edgeType = DDGEdgeType.Data;
      edgeProps.nByType[edgeType] = (edgeProps.nByType[edgeType] || 0) + 1;
    }
    else {
      // inputDataNodeId is ignored or external (are there other reasons?)
      // this.#shouldIgnoreDataNode(ownDataNode.nodeId)
    }
  }

  #addDataNodeToTimeline(dataNode, trace) {
    const { dp } = this;

    if (!dataNode) {
      // this.logger.logTrace(`NYI: trace did not have own DataNode: "${dp.util.makeTraceInfo(traceId)}"`);
      return null;
    }


    const isDecision = dp.util.isTraceControlDecision(trace.traceId);
    // Verbose && this.debug(`Adding Trace: t#${trace.traceId}, n#${dataNode.nodeId}, s#${trace.staticTraceId}, ${isDecision}`);

    // if (DataNodeType.is.Write(ownDataNode.type) && isDecision) {
    //   // future-work: add two nodes in this case
    // }

    /**
     * This is to avoid duplicate edges.
     * NOTE also that in JS, Sets retain order.
     * @type {Map.<DataTimelineNode, { n: number }>}
     */
    const inputNodes = new Map();

    // ignore + skip logic
    if (!this.#processSkipAndIgnore(dataNode, isDecision)) {
      return null;
    }

    if (dataNode.valueFromId) {
      this.#addInputNodeEdge(dataNode.valueFromId, inputNodes);
    }

    if (dataNode.inputs) {
      for (const inputDataNodeId of dataNode.inputs) {
        this.#addInputNodeEdge(inputDataNodeId, inputNodes);
      }
    }

    let newNode;
    if (isDecision) {
      newNode = this.addDecisionNode(dataNode, trace);
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
    const valueRefId = dataNode.refId;
    const varDeclarationTid = dataNode.varAccess?.declarationTid;
    // if (accessedRefId) {
    //   this.ddg._lastAccessDataNodeIdByRefId[accessedRefId] = newNode.startDataNodeId || dataNode.nodeId;
    // }
    // if (valueRefId) {
    //   this.ddg._lastAccessDataNodeIdByRefId[valueRefId] = newNode.startDataNodeId || dataNode.nodeId;
    // }
    newNode.hasSummarizableWrites = !!accessedRefId || !!varDeclarationTid;

    // update group
    const currentGroup = this.peekStack();
    currentGroup.hasSummarizableWrites ||= newNode.hasSummarizableWrites;

    // add edges
    // if (isDataTimelineNode(newNode.type)) { // TODO: this will not be necessary once we fix `refNode`s
    for (const [inputNode, edgeProps] of inputNodes) {
      this.ddg.addEdge(DDGEdgeType.Data, inputNode.timelineId, newNode.timelineId, edgeProps);
    }
    // }
    return newNode;
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
}
