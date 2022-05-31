import last from 'lodash/last';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import TraceType, { isBeforeCallExpression, isTraceReturn } from '@dbux/common/src/types/constants/TraceType';
import { isTraceControlRolePush } from '@dbux/common/src/types/constants/TraceControlRole';
import { newLogger } from '@dbux/common/src/log/logger';
import DataNodeType, { isDataNodeModifyType } from '@dbux/common/src/types/constants/DataNodeType';
import RefSnapshot from '@dbux/common/src/types/RefSnapshot';
import { typedShallowClone } from '@dbux/common/src/util/typedClone';
// eslint-disable-next-line max-len
import DDGTimelineNodeType, { isRepeatedRefTimelineNode, isControlGroupTimelineNode, isDataTimelineNode, isDecisionNode, isLoopIterationTimelineNode, isLoopTimelineNode, isSnapshotTimelineNode } from '@dbux/common/src/types/constants/DDGTimelineNodeType';
// eslint-disable-next-line max-len
import { DDGTimelineNode, ContextTimelineNode, PrimitiveTimelineNode, DataTimelineNode, TimelineRoot, RefSnapshotTimelineNode, GroupTimelineNode, BranchTimelineNode, IfTimelineNode, DecisionTimelineNode, IterationNode, RepeatedRefTimelineNode } from './DDGTimelineNodes';
import { makeContextLabel, makeTraceLabel } from '../helpers/makeLabels';
import DDGEdge from './DDGEdge';
import DDGEdgeType from './DDGEdgeType';
import { controlGroupLabelMaker, branchSyntaxNodeCreators } from './timelineControlUtil';
import ddgQueries from './ddgQueries';
import DDGNodeSummary from './DDGNodeSummary';

/** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */
/** @typedef {import('@dbux/common/src/types/DataNode').default} DataNode */
/** @typedef {import('@dbux/common/src/types/RefSnapshot').ISnapshotChildren} ISnapshotChildren */
/** @typedef { Map.<number, RefSnapshotTimelineNode } SnapshotMap */

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

  /**
   * @type {Obejct.<number, DataTimelineNode>}
   */
  firstTimelineDataNodeByDataNodeId = [];

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
    this.#addNode(timelineRoot);
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

  #getDataTimelineInputNode(dataNodeId) {
    // 1. look for skips
    let inputNode = this.skippedNodesByDataNodeId[dataNodeId];
    if (!inputNode) {
      // 2. DataNode was not skipped → get its DataTimelineNode
      inputNode = this.getFirstDataTimelineNodeByDataNodeId(dataNodeId);
    }
    return inputNode;
  }

  getLastVarSnapshotNode(declarationTid) {
    return this.lastTimelineVarSnapshotNodeByDeclarationTid[declarationTid];
  }

  /** ###########################################################################
   * snapshots
   *  #########################################################################*/

  /** ###########################################################################
   * TODO: move all the below to `BaseDDG`
   * ##########################################################################*/

  getFirstDataTimelineNodeByDataNodeId(dataNodeId) {
    return this.firstTimelineDataNodeByDataNodeId[dataNodeId];
  }

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
          newChild = this.#addNewRefSnapshot(lastModDataNode, lastModDataNode.refId, snapshotsByRefId, parentSnapshot);
        }
        else {
          // primitive
          const fromNode = this.#getDataTimelineInputNode(lastModDataNode.nodeId);
          newChild = this.#addPrimitiveDataNode(lastModDataNode);
          if (fromNode && !this.ddg.isSummarizing) {
            // add edges, but not during summarization
            // TODO: determine correct DDGEdgeType
            const edgeType = DDGEdgeType.Data;
            const edgeState = { nByType: { [edgeType]: 1 } };
            this.ddg.addEdge(edgeType, fromNode.timelineId, newChild.timelineId, edgeState);
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
    const originalNode = this.ddg.timelineNodes[timelineId];

    let cloned;
    if (isDataTimelineNode(originalNode.type)) {
      // original was data node (probably primitive)
      cloned = typedShallowClone(originalNode);
      this.#doAddDataNode(cloned);
    }
    else if (isRepeatedRefTimelineNode(originalNode.type)) {
      cloned = typedShallowClone(originalNode);
      this.#addNode(cloned);
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
    const originalNode = this.ddg.timelineNodes[timelineId];
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
    this.#addNode(snapshot);
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
    if (isRoot && !ddgQueries.isSnapshotDescendant(this.ddg, snapshot, parentSnapshot)) {
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
  #addNewRefSnapshot(ownDataNode, refId, snapshotsByRefId, parentSnapshot) {
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

    const existingSnapshot = this.ddg._refSnapshotsByDataNodeId[ownDataNode.nodeId];
    if (existingSnapshot) {
      // clone existing snapshot
      return this.#deepCloneNode(existingSnapshot.timelineId, snapshotsByRefId);
    }

    /**
     * Create new
     */
    const snapshot = new RefSnapshotTimelineNode(ownDataNode.traceId, ownDataNode.nodeId, refId);
    snapshot.label = this.#makeDataNodeLabel(ownDataNode);
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
    this.ddg._refSnapshotsByDataNodeId[snapshot.dataNodeId] = snapshot;

    return snapshot;
  }

  /**
   * @param {number} timelineId
   */
  #buildNodeSummarySnapshots(timelineId) {
    const { dp, ddg } = this;
    const node = this.ddg._timelineNodes[timelineId];
    if (!node.hasRefWriteNodes || ddg.nodeSummaries[timelineId]) {
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
      if (this.ddg._lastAccessDataNodeIdByRefId[refId] <= lastNestedDataNodeId) {
        // skip: this ref is only used internally (or before) this node. It is not accessed AFTER this node
        continue;
      }
      if (snapshotsByRefId.has(refId)) {
        // skip: this ref was already added as a descendant of a previous ref
        continue;
      }
      const dataNode = dp.collections.dataNodes.getById(dataNodeId);
      this.#addNewRefSnapshot(dataNode, refId, snapshotsByRefId, null);
    }

    const roots = Array.from(snapshotsByRefId.values()).filter(snap => !snap.parentNodeId);

    // done → set `summaryNodes` to be only the roots of this set
    const summaryNodes = roots;
    ddg.nodeSummaries[timelineId] = new DDGNodeSummary(timelineId, snapshotsByRefId, summaryNodes);
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
        const childNode = this.ddg.timelineNodes[childId];
        const lastChildDataNodeId = this.#collectNestedUniqueRefTrees(childNode, lastModifyNodesByRefId);
        if (lastChildDataNodeId) {
          lastDataNodeId = lastChildDataNodeId;
        }
      }
    }
    return lastDataNodeId;
  }

  /** ###########################################################################
   * other data nodes
   *  #########################################################################*/

  /**
   * @param {DataNode} dataNode 
   * @return {PrimitiveTimelineNode}
   */
  #addPrimitiveDataNode(dataNode) {
    const label = this.#makeDataNodeLabel(dataNode);
    const newNode = new PrimitiveTimelineNode(dataNode.nodeId, label);

    this.#doAddDataNode(newNode);

    return newNode;
  }

  /**
   * Decision nodes are control nodes.
   * Inside of loops, they also serve as starting point for iterations.
   * 
   * @param {DataNode} dataNode 
   * @param {Trace} trace
   * @return {PrimitiveTimelineNode}
   */
  #addDecisionNode(dataNode, trace) {
    const { dp } = this;
    const currentGroup = this.peekStack();
    const staticTrace = dp.collections.staticTraces.getById(trace.staticTraceId);

    const label = this.#makeDataNodeLabel(dataNode);
    const decisionNode = new DecisionTimelineNode(dataNode.nodeId, label);
    this.#doAddDataNode(decisionNode);

    if (isLoopIterationTimelineNode(currentGroup.type)) {
      // continued iteration of loop

      this.#popGroup(); // pop previous iteration
      if (!this.#checkCurrentControlGroup(staticTrace, trace)) {
        // make sure, we are in the correct loop
        return null;
      }
      if (dp.util.isDataNodeValueTruthy(dataNode.nodeId)) {
        // push next iteration
        const iterationNode = new IterationNode(decisionNode.timelineId);
        this.#addAndPushGroup(iterationNode);
      }
    }
    else {
      if (!this.#checkCurrentControlGroup(staticTrace, trace)) {
        return null;
      }
      if (isLoopTimelineNode(currentGroup.type)) {
        // push first iteration of loop
        const iterationNode = new IterationNode(decisionNode.timelineId);
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
  #doAddDataNode(newNode) {
    const { dp } = this;
    this.#addNode(newNode);
    this.firstTimelineDataNodeByDataNodeId[newNode.dataNodeId] ||= newNode;
    newNode.hasRefNodes = !!dp.util.getDataNodeModifyingRefId(newNode.dataNodeId);
  }

  /** ###########################################################################
   * create and/or add nodes (basics)
   * ##########################################################################*/

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
          this.getFirstDataTimelineNodeByDataNodeId(dataNode.valueFromId);

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
        this.logger.logTrace(`NYI: trace has multiple dataNodes accessing different objectNodeIds - "${dp.util.makeTraceInfo(ownDataNode.traceId)}"`);
      }
      const snapshotsByRefId = new Map();
      newNode = this.#addNewRefSnapshot(ownDataNode, refId, snapshotsByRefId, null);
    }
    else {
      // primitive value or ref assignment
      if (dataNodes.length > 1) {
        // eslint-disable-next-line max-len
        this.logger.logTrace(`NYI: trace has multiple dataNodes but is not ref type (→ rendering first node as primitive) - at trace="${dp.util.makeTraceInfo(ownDataNode.traceId)}"`);
      }
      newNode = this.#addPrimitiveDataNode(ownDataNode);
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
  #addNode(newNode) {
    newNode.timelineId = this.ddg.timelineNodes.length;
    this.ddg.timelineNodes.push(newNode);
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
   * labels
   * {@link DDGTimelineBuilder##makeDataNodeLabel}
   * ##########################################################################*/

  #makeDataNodeLabel(dataNode) {
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
      this.logger.trace(`Invalid Decision node.\n  ` +
        `${trace && `At trace: ${dp.util.makeTraceInfo(trace)}` || ''}\n  ` +
        // eslint-disable-next-line max-len
        `Expected control group for: ${staticTrace.controlId && dp.util.makeStaticTraceInfo(staticTrace.controlId)},\n  ` +
        `Actual group: ${groupTag} ${groupControlInfo} (${JSON.stringify(currentGroup)})\n\n`
      );
      return false;
    }
    return true;
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
      this.#addAndPushGroup(new ContextTimelineNode(trace.contextId, contextLabel));
    }
    else if (isTraceControlRolePush(staticTrace.controlRole)) {
      // push branch statement
      const controlStatementId = staticTrace.controlId;
      const { syntax } = dp.collections.staticTraces.getById(controlStatementId);
      const ControlGroupCtor = branchSyntaxNodeCreators[syntax];
      if (!ControlGroupCtor) {
        this.logger.trace(`BranchSyntaxNodeCreators does not exist for syntax=${syntax} at trace="${dp.util.makeStaticTraceInfo(staticTrace.staticTraceId)}"`);
      }
      else {
        this.#addAndPushGroup(new ControlGroupCtor(controlStatementId));
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
        const label = controlGroupLabelMaker[currentGroup.type]?.(ddg, currentGroup);
        currentGroup.label = label || '';
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


    // register DataNode by refId
    const accessedRefId = dp.util.getDataNodeAccessedRefId(ownDataNode.nodeId);
    const valueRefId = ownDataNode.refId;
    if (accessedRefId) {
      this.ddg._lastAccessDataNodeIdByRefId[accessedRefId] = ownDataNode.nodeId;
    }
    if (valueRefId) {
      this.ddg._lastAccessDataNodeIdByRefId[valueRefId] = ownDataNode.nodeId;
    }


    const isDecision = dp.util.isTraceControlDecision(traceId);

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
        this.logger.debug(`IGNORE`, this.#makeDataNodeLabel(ownDataNode));
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

    if (ownDataNode.inputs) {
      for (const inputDataNodeId of ownDataNode.inputs) {
        const inputNode = this.#getDataTimelineInputNode(inputDataNodeId);

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
      newNode = this.#addDecisionNode(ownDataNode, trace);
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
    newNode.hasRefWriteNodes = !!accessedRefId;

    // update group
    const currentGroup = this.peekStack();
    currentGroup.hasRefWriteNodes ||= newNode.hasRefWriteNodes;

    // add edges
    if (isDataTimelineNode(newNode.type)) { // TODO: this will not be necessary once we fix `refNode`s
      for (const [inputNode, edgeProps] of inputNodes) {
        this.ddg.addEdge(DDGEdgeType.Data, inputNode.timelineId, newNode.timelineId, edgeProps);
      }
    }
  }

  /**
   * During initial build, not all details of every node are prepared.
   * When investigating a node's details, this function needs to run first.
   */
  buildNodeSummary(timelineId) {
    this.#buildNodeSummarySnapshots(timelineId);
  }


  /** ###########################################################################
   * stack util
   * ##########################################################################*/

  /**
   * @param {GroupTimelineNode} newGroupNode 
   */
  #addAndPushGroup(newGroupNode) {
    this.#addNode(newGroupNode);
    this.#addNodeToGroup(newGroupNode);
    this.stack.push(newGroupNode);
  }

  #popGroup() {
    const nestedGroup = this.stack.pop();
    const currentGroup = this.peekStack();
    currentGroup.hasRefWriteNodes ||= nestedGroup.hasRefWriteNodes;
    return nestedGroup;
  }
}
