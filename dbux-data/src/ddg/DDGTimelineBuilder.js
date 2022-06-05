import last from 'lodash/last';
import TraceType, { isBeforeCallExpression, isTraceReturn } from '@dbux/common/src/types/constants/TraceType';
import { isTraceControlRolePush } from '@dbux/common/src/types/constants/TraceControlRole';
import { newLogger } from '@dbux/common/src/log/logger';
import DataNodeType, { isDataNodeModifyType } from '@dbux/common/src/types/constants/DataNodeType';
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
   * The last write of given var (declarationTid)
   * or the first node that accessed the var (within bounds).
   * 
   * @type {Object.<number, DataTimelineNode>}
   */
  lastTimelineVarSnapshotNodeByDeclarationTid = {};

  /** ########################################
   * other fields
   *  ######################################*/

  logger;

  /** ########################################
   * ctor
   *  ######################################*/

  /**
   * @param {import('./BaseDDG').default} ddg
   */
  constructor(ddg) {
    this.ddg = ddg;
    this.logger = newLogger(DDGTimelineBuilder.name);

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

  peekStack() {
    return last(this.stack);
  }

  getLastVarSnapshotNode(declarationTid) {
    return this.lastTimelineVarSnapshotNodeByDeclarationTid[declarationTid];
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
        const iterationNode = new IterationNode(decisionNode.timelineId, trace.traceId);
        this.#addAndPushGroup(iterationNode);
      }
    }
    else {
      if (!this.#checkCurrentControlGroup(staticTrace, trace)) {
        return null;
      }
      if (isLoopTimelineNode(currentGroup.type)) {
        // push first iteration of loop
        const iterationNode = new IterationNode(decisionNode.timelineId, trace.traceId);
        this.#addAndPushGroup(iterationNode);
      }
      else {
        // non-loop branch
        currentGroup.decisions.push(decisionNode.timelineId);
      }
    }
    return decisionNode;
  }
  
  /**
   * @param {DataTimelineNode} newNode 
   */
  onNewSnapshotValueNode(newNode) {
    const fromNode = this.getDataTimelineInputNode(newNode.dataNodeId);
    if (fromNode) {
      // add edges, but not during summarization
      // TODO: determine correct DDGEdgeType
      const edgeType = DDGEdgeType.Data;
      const edgeState = { nByType: { [edgeType]: 1 } };
      this.ddg.addEdge(edgeType, fromNode.timelineId, newNode.timelineId, edgeState);
    }
  }

  #shouldIgnoreDataNode(dataNodeId) {
    const trace = this.dp.util.getTraceOfDataNode(dataNodeId);
    if (trace) {
      const { traceId } = trace;
      const dataNode = this.dp.util.getDataNode(dataNodeId);
      const traceType = this.dp.util.getTraceType(traceId);
      if (isBeforeCallExpression(traceType)) {
        // ignore BCEs for now
        // TODO: some built-in BCEs carry DataNodes
        return true;
      }
      if (TraceType.is.Declaration(traceType) && !dataNode.inputs) {
        // ignore declaration-only nodes
        // → connect to first write instead
        return true;
      }
    }
    return false;
  }

  #shouldSkipDataNode(dataNodeId) {
    if (this.dp.util.isDataNodePassAlong(dataNodeId)) {
      // skip all "pass along" nodes
      return true;
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
  #skipDataNode(dataNode) {
    if (!this.#shouldSkipDataNode(dataNode.nodeId)) {
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
    if (dataNode.varAccess?.declarationTid) {
      prev = this.getLastVarSnapshotNode(dataNode.varAccess.declarationTid);
      // if (!prev && dataNode is not declarationTid) {
      //   TODO: handle external nodes
      // }
    }
    else if (dataNode.refId) {
      // TODO: look up by varAccess

      // const prevSnapshotNode = this.getLastRefSnapshotNode(dataNode.refId);
      // prev = prevSnapshotNode?.refNode;
    }
    else {
      // there is no previous guy for this guy
      // return null;
    }

    if (!prev) {
      // → look-up input
      if (dataNode.valueFromId) {
        // TODO: we currently don't have valueFromId for refs
        //      → keep track of all ref occurrences, instead of only the last?

        prev =
          this.skippedNodesByDataNodeId[dataNode.valueFromId] ||
          this.ddg.getFirstDataTimelineNodeByDataNodeId(dataNode.valueFromId);

        // if (!prev) {
        //   // TODO: handle external nodes
        // }
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
  #addDataNodeToTimeline(ownDataNode, dataNodes) {
    let newNode;

    const { dp } = this;

    // create node based on DDGTimelineNodeType
    // if() {
    //   TODO: add DecisionTimelineNode
    // }
    // else 
    const refId = this.#getRefIdForSnapshot(ownDataNode);
    if (refId) {
      // TODO: handle assignment patterns (→ can have multiple write targets)
      const refNodeId = ownDataNode.varAccess?.objectNodeId;
      // ref type access → add Snapshot
      if (dataNodes.some(dataNode => dataNode.varAccess?.objectNodeId !== refNodeId)) {
        // sanity checks
        this.logger.trace(`NYI: trace has multiple dataNodes accessing different objectNodeIds - "${dp.util.makeTraceInfo(ownDataNode.traceId)}"`);
      }
      const snapshotsByRefId = new Map();
      newNode = this.ddg.addNewRefSnapshot(ownDataNode, refId, snapshotsByRefId, null);
    }
    else {
      // this is not a watched ref

      // if (dataNodes.length > 1) {
      //   // eslint-disable-next-line max-len
      //   this.logger.trace(`NYI: trace has multiple dataNodes but is not ref type (→ rendering first node as primitive) - at trace="${dp.util.makeTraceInfo(ownDataNode.traceId)}"`);
      // }
      newNode = this.ddg.addValueDataNode(ownDataNode);
    }

    if (ownDataNode.varAccess?.declarationTid && (
      isDataNodeModifyType(ownDataNode.type) ||
      !this.lastTimelineVarSnapshotNodeByDeclarationTid[ownDataNode.varAccess.declarationTid]
    )) {
      // register node by var
      this.lastTimelineVarSnapshotNodeByDeclarationTid[ownDataNode.varAccess.declarationTid] = newNode;
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
   * NOTE: we only create snapshots for watched or summarized entries.
   * @param {DataNode} dataNode 
   */
  #getRefIdForSnapshot(dataNode) {
    let refId;
    const dataNodeId = dataNode.nodeId;
    if (
      (
        (
          (refId = dataNode.refId) &&
          this.ddg.watchSet.isWatchedDataNode(dataNodeId)
        ) /* ||
        (
          (refId = dataNode.varAccess?.objectNodeId)
        ) */
      ) /* &&
      // NOTE: render as "Primitive" instead if ValueRef does not have children
      (this.dp.collections.values.getById(refId))?.children */
    ) {
      return refId;
    }
    return 0;
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
        this.#addAndPushGroup(new ControlGroupCtor(controlStatementId), traceId);
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
    const { dp, ddg: { bounds } } = this;
    const trace = dp.util.getTrace(traceId);
    const dataNodes = dp.util.getDataNodesOfTrace(traceId);
    // const ownDataNode = trace.nodeId && dataNodes.find(dataNode => dataNode.nodeId === trace.nodeId);
    const ownDataNode = trace.nodeId && dp.collections.dataNodes.getById(trace.nodeId);

    if (!ownDataNode) {
      // this.logger.logTrace(`NYI: trace did not have own DataNode: "${dp.util.makeTraceInfo(traceId)}"`);
      return;
    }


    const isDecision = dp.util.isTraceControlDecision(traceId);
    Verbose && this.debug(`Adding Trace: t#${traceId}, n#${ownDataNode.nodeId}, s#${trace.staticTraceId}, ${isDecision}`);

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
    // TODO: allow for decision skips as well
    if (!isDecision && !this.ddg.watchSet.isWatchedDataNode(ownDataNode.nodeId)) {
      if (this.#shouldIgnoreDataNode(ownDataNode.nodeId)) {
        // ignore entirely
        Verbose > 1 && this.logger.debug(`IGNORE`, this.ddg.makeDataNodeLabel(ownDataNode));
        return;
      }
      const skippedBy = this.#skipDataNode(ownDataNode);
      if (skippedBy) {
        // → This node SHOULD be skipped and CAN be skipped.
        // → register skip node
        // Any outgoing edge should be connected to `skippedBy` instead of `ownDataNode`.
        this.skippedNodesByDataNodeId[ownDataNode.nodeId] = skippedBy;
        return;
      }
    }

    // bookkeeping for summaries
    const accessedRefId = dp.util.getDataNodeAccessedRefId(ownDataNode.nodeId);
    const valueRefId = ownDataNode.refId;
    const varDeclarationTid = ownDataNode.varAccess?.declarationTid;
    if (accessedRefId) {
      this.ddg._lastAccessDataNodeIdByRefId[accessedRefId] = ownDataNode.nodeId;
    }
    if (valueRefId) {
      this.ddg._lastAccessDataNodeIdByRefId[valueRefId] = ownDataNode.nodeId;
    }

    if (ownDataNode.inputs) {
      for (const inputDataNodeId of ownDataNode.inputs) {
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
    }

    let newNode;
    if (isDecision) {
      newNode = this.addDecisionNode(ownDataNode, trace);
      if (!newNode) {
        return;
      }
    }
    else {
      /**
       * Add new node.
       * NOTE: Don't add while still resolving connections above.
       * NOTE2: For now, don't skip adding since that causes issues with final node ordering.
       * @type {DataTimelineNode}
       */
      newNode = this.#addDataNodeToTimeline(ownDataNode, dataNodes);
    }
    newNode.hasSummarizableWrites = !!accessedRefId || !!varDeclarationTid;

    // update group
    const currentGroup = this.peekStack();
    currentGroup.hasSummarizableWrites ||= newNode.hasSummarizableWrites;

    // add edges
    if (isDataTimelineNode(newNode.type)) { // TODO: this will not be necessary once we fix `refNode`s
      for (const [inputNode, edgeProps] of inputNodes) {
        this.ddg.addEdge(DDGEdgeType.Data, inputNode.timelineId, newNode.timelineId, edgeProps);
      }
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

    Verbose && this.debug(`PUSH ${this.#makeGroupDebugTag(newGroup)}`);
    this.stack.push(newGroup);
  }

  #popGroup() {
    const nestedGroup = this.stack.pop();
    Verbose && this.debug(`POP ${this.#makeGroupDebugTag(nestedGroup)}`);
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
