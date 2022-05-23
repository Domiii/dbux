/** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */
/** @typedef {import('@dbux/common/src/types/DataNode').default} DataNode */

import last from 'lodash/last';
import TraceType, { isBeforeCallExpression, isTraceReturn } from '@dbux/common/src/types/constants/TraceType';
import { isTraceControlRolePush } from '@dbux/common/src/types/constants/TraceControlRole';
import { newLogger } from '@dbux/common/src/log/logger';
import DataNodeType, { isDataNodeModifyType } from '@dbux/common/src/types/constants/DataNodeType';
import RefSnapshot from '@dbux/common/src/types/RefSnapshot';
import { typedShallowClone } from '@dbux/common/src/util/typedClone';
// eslint-disable-next-line max-len
import { DDGTimelineNode, ContextTimelineNode, PrimitiveTimelineNode, DataTimelineNode, TimelineRoot, RefSnapshotTimelineNode, GroupTimelineNode } from './DDGTimelineNodes';
import { makeContextLabel, makeTraceLabel } from '../helpers/makeLabels';
import DDGEdge from './DDGEdge';
import DDGEdgeType from './DDGEdgeType';

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
   * The last snapshot of given `refId`.
   * NOTE: The last snapshot by `refId`. The snapshot tree generally contains both reads, writes and also untouched nodes.
   * 
   * @type {Object.<number, RefSnapshotTimelineNode>}
   */
  lastTimelineRefSnapshotNodeByRefId = {};

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
   * @param {import('./DataDependencyGraph').default} ddg
   */
  constructor(ddg) {
    this.ddg = ddg;
    this.logger = newLogger(DDGTimelineBuilder.name);

    const timelineRoot = this.ddg.timelineRoot = new TimelineRoot();
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

  getFirstDataTimelineNodeByDataNodeId(dataNodeId) {
    return this.firstTimelineDataNodeByDataNodeId[dataNodeId];
  }

  getLastRefSnapshotNode(refId) {
    return this.lastTimelineRefSnapshotNodeByRefId[refId];
  }

  getLastVarSnapshotNode(declarationTid) {
    return this.lastTimelineVarSnapshotNodeByDeclarationTid[declarationTid];
  }

  /** ###########################################################################
   * snapshots
   *  #########################################################################*/

  #canBeRefSnapshot(dataNode) {
    let refId;
    return (
      (refId = dataNode.varAccess?.objectNodeId) &&

      // render as Primitive if ValueRef does not have children
      (this.dp.collections.values.getById(refId))?.children
    );
  }

  #addSnapshotChildren(snapshot, originalChildren, modificationDataNodes, isOriginalValueRef) {
    /**
       * @type {Object.<string, DataNode>}
       */
    const lastModsByProp = {};

    for (const dataNode of modificationDataNodes) {
      lastModsByProp[dataNode.varAccess.prop] = dataNode;
    }

    const allProps = {
      ...Object.keys(lastModsByProp),
      ...Object.keys(originalChildren)
    };

    // create children
    snapshot.children = new originalChildren.constructor();
    for (const prop of allProps) {
      const lastModDataNode = lastModsByProp[prop];
      let newChild;
      if (!lastModDataNode) {
        // initial value
        /**
         * @type {RefSnapshot | number | any}
         */
        const original = originalChildren[prop];
        if (isOriginalValueRef) {
          if (original.refId) {
            // nested ref
            // PROBLEM: the children of nested initial reference values are not addressable
            //      → because they cannot have a unique `accessId`!!
            //      → meaning that their root ValueRef's dataNode is accessed instead of `original`.
            throw new Error('NYI: nested initial reference types are currently not supported');
          }
          else {
            // primitive
            // PROBLEM: this node does not have a unique `dataNode` (but is addressable)
            //    TODO: → might need to address through its parent (just like `varAccess`)
            throw new Error('NYI: nested initial primitive value');
          }
        }
        else {
          // original is timelineId
          const originalNode = this.ddg.timelineNodes[original];
          newChild = typedShallowClone(originalNode);
          if (newChild instanceof DataTimelineNode) {
            this.#doAddDataNode(newChild);
          }
          else {
            this.#addNode(newChild);
          }
        }
      }
      else {
        // apply lastMod
        if (this.#canBeRefSnapshot(lastModDataNode)) {
          // nested ref
          newChild = this.#addRefSnapshot(lastModDataNode, null);
        }
        else {
          // primitive
          newChild = this.#addPrimitiveDataNode(lastModDataNode);
        }
      }
      snapshot.children[prop] = newChild.timelineId;
    }
  }

  /**
   * @param {DataNode} ownDataNode 
   * @param {DataNode[]?} dataNodes
   * 
   * @return {RefSnapshotTimelineNode}
   */
  #addRefSnapshot(ownDataNode, dataNodes) {
    const { dp } = this;
    // const { nodeId: dataNodeId } = ownDataNode;
    const { refId } = ownDataNode;
    if (!refId) {
      throw new Error(`missing refId`);
    }

    /**
     * Create Snapshot node
     */
    const snapshot = new RefSnapshotTimelineNode(ownDataNode.nodeId, refId);
    snapshot.label = this.#makeDataNodeLabel(ownDataNode);
    this.#addNode(snapshot);

    const previousSnapshot = this.getLastRefSnapshotNode(refId);
    if (!previousSnapshot) {
      /**
       * → build new snapshot.
       * NOTE: this is (very) loosely based on {@link dp.util.constructVersionedValueSnapshot}.
       */

      const valueRef = this.dp.collections.values.getById(refId);

      // get last modifications by prop
      const fromTraceId = 0;
      const toTraceId = ownDataNode.traceId;
      const modificationDataNodes = dp.util.collectDataSnapshotModificationNodes(snapshot, fromTraceId, toTraceId);
      
      this.#addSnapshotChildren(snapshot, valueRef.children, modificationDataNodes, true);
    }
    else {
      /**
       * → deep clone original snapshot.
       */
      this.#addSnapshotChildren(snapshot, previousSnapshot.children, dataNodes, false);
    }
  }

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
   * @param {DataTimelineNode} newNode 
   */
  #doAddDataNode(newNode) {
    newNode.dataTimelineId = this.ddg.timelineDataNodes.length;
    this.ddg.timelineDataNodes.push(newNode);
    this.firstTimelineDataNodeByDataNodeId[newNode.dataNodeId] ||= newNode;
    this.#addNode(newNode);
  }

  /** ###########################################################################
   * create and/or add nodes (basics)
   * ##########################################################################*/

  #shouldSkipDataNode(dataNodeId) {
    if (this.dp.util.isDataNodePassAlong(dataNodeId)) {
      // skip all "pass along" nodes
      return true;
    }

    const trace = this.dp.util.getTraceOfDataNode(dataNodeId);
    if (trace) {
      if (isBeforeCallExpression(trace.type)) {
        // TODO: some built-in BCEs carry DataNodes
        // skip BCE
        return true;
      }
    }
    return false;
  }

  /**
   * Find the last timeline node of same `inputDataNode`'s `accessId`.
   * 
   * @param {DataNode} dataNode
   * @param {DataNode} inputDataNode
   * @return {DataTimelineNode}
   */
  #followInputDataNode(dataNode, inputDataNode) {
    // const { dp, ddg: { bounds } } = this;
    if (inputDataNode.refId) {
      const prev = this.getLastRefSnapshotNode(inputDataNode.refId);
      if (prev) {
        return prev;
      }
    }
    else if (inputDataNode.varAccess?.declarationTid) {
      const prev = this.getLastVarSnapshotNode(inputDataNode.varAccess.declarationTid);
      if (prev) {
        return prev;
      }
    }
    else {
      // there is no previous guy for this guy
      return null;
    }

    // TODO: handle external nodes
    return null;
  }

  /**
   * 
   */
  #addDataNode(ownDataNode, dataNodes) {
    let newNode;

    const { dp } = this;

    // create node based on DDGTimelineNodeType
    // if() {
    //   TODO: add DecisionTimelineNode
    // }
    // else 
    if (this.#canBeRefSnapshot(ownDataNode)) {
      // TODO: handle assignment patterns (→ can have multiple write targets)
      const refNodeId = ownDataNode.varAccess.objectNodeId;
      // ref type access → add Snapshot
      if (dataNodes.some(dataNode => dataNode.varAccess?.objectNodeId !== refNodeId)) {
        // sanity checks
        this.logger.logTrace(`NYI: trace has multiple dataNodes accessing different objectNodeIds - "${dp.util.makeTraceInfo(ownDataNode.traceId)}"`);
      }
      newNode = this.#addRefSnapshot(ownDataNode, dataNodes);
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

  #addNodeToGroup(newNode) {
    const parent = this.peekStack();
    parent.children.push(newNode.timelineId);
  }


  /** ###########################################################################
   * {@link DDGTimelineBuilder#updateStack}
   * ##########################################################################*/

  /**
   * Keep track of the stack.
   */
  updateStack(traceId) {
    const { dp } = this;
    const trace = dp.util.getTrace(traceId);
    const staticTrace = dp.util.getStaticTrace(traceId);
    if (TraceType.is.PushImmediate(staticTrace.type)) {
      // push context
      const context = dp.collections.executionContexts.getById(trace.contextId);
      const contextLabel = makeContextLabel(context, dp.application);
      this.#pushGroup(new ContextTimelineNode(trace.contextId, contextLabel));
    }
    else if (isTraceControlRolePush(staticTrace.controlRole)) {
      // push branch statement
      // TODO
    }
    else if (dp.util.isTraceControlGroupPop(traceId)) {
      // sanity checks
      if (TraceType.is.PopImmediate(staticTrace.type)) {
        // pop context
        const top = this.peekStack();
        if (trace.contextId !== top.contextId) {
          this.logger.logTrace(`Invalid pop: expected context=${trace.contextId}, but got: ${top.toString()}`);
          return;
        }
      }
      else {
        // pop branch statement
        // TODO
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
    const ownDataNode = trace.nodeId && dataNodes.find(dataNode => dataNode.nodeId === trace.nodeId);

    if (!ownDataNode) {
      // this.logger.logTrace(`NYI: trace did not have own DataNode: "${dp.util.makeTraceInfo(traceId)}"`);
      return;
    }

    if (DataNodeType.is.Write(ownDataNode.type) && dp.util.isTraceControlDecision(traceId)) {
      // TODO: add two nodes in this case
    }

    /**
     * This is to avoid duplicate edges.
     * NOTE also that in JS, Sets retain order.
     * @type {Set.<DataTimelineNode>}
     */
    const targetNodesSet = new Set();

    if (ownDataNode.inputs) { // only add nodes with connectivity
      for (const inputDataNodeId of ownDataNode.inputs) {
        let inputDataNode = dp.util.getDataNode(inputDataNodeId);
        /**
         * @type {DataTimelineNode}
         */
        let targetInputNode;
        let targetDataNodeId = inputDataNodeId;

        // skip pass along nodes
        while (this.#shouldSkipDataNode(targetDataNodeId)) {
          // connect to last registered node of DataNode (if existing)
          const targetNodeCandidate = this.#followInputDataNode(ownDataNode, inputDataNode);

          if (!targetNodeCandidate) {
            // end of the line
            break;
          }
          targetInputNode = targetNodeCandidate;
          targetDataNodeId = targetInputNode.dataNodeId;
        }

        if (!targetInputNode) {
          targetInputNode = this.getFirstDataTimelineNodeByDataNodeId(inputDataNodeId);
        }

        if (targetInputNode && !targetNodesSet.has(targetInputNode)) {
          targetNodesSet.add(targetInputNode);
        }
        else {
          // → this edge has already been registered, meaning there are multiple connections between exactly these two nodes
          // TODO: make it a GroupEdge with `writeCount` and `controlCount` instead?
          // TODO: add summarization logic
        }
      }
    }

    /**
     * Add new node.
     * NOTE: Don't add while still resolving connections above.
     * NOTE2: For now, don't skip adding since that causes issues with final node ordering.
     * @type {DataTimelineNode}
     */
    const newNode = this.#addDataNode(ownDataNode, dataNodes);

    // add edges
    for (const targetNode of targetNodesSet) {
      this.#addEdge(targetNode, newNode);
    }
  }

  /** ###########################################################################
   * edges
   * ##########################################################################*/


  #addEdgeToMap(map, id, edge) {
    let edges = map.get(id);
    if (!edges) {
      map.set(id, edges = []);
    }
    edges.push(edge);
  }

  /**
   * @param {DataTimelineNode} fromNode 
   * @param {DataTimelineNode} toNode 
   */
  #addEdge(fromNode, toNode) {
    const newEdge = new DDGEdge(DDGEdgeType.Write, this.ddg.edges.length, fromNode.dataTimelineId, toNode.dataTimelineId);
    this.ddg.edges.push(newEdge);

    this.#addEdgeToMap(this.ddg.inEdgesByDataTimelineId, toNode.dataTimelineId, newEdge);
    this.#addEdgeToMap(this.ddg.outEdgesByDataTimelineId, fromNode.dataTimelineId, newEdge);
  }

  /** ###########################################################################
   * stack util
   * ##########################################################################*/

  /**
   * @param {GroupTimelineNode} newGroupNode 
   */
  #pushGroup(newGroupNode) {
    this.#addNode(newGroupNode);
    this.#addNodeToGroup(newGroupNode);
    this.stack.push(newGroupNode);
  }

  #popGroup() {
    return this.stack.pop();
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
}
