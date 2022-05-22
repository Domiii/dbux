/** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */

import last from 'lodash/last';
import TraceType, { isTraceReturn } from '@dbux/common/src/types/constants/TraceType';
import { isTraceControlRolePush } from '@dbux/common/src/types/constants/TraceControlRole';
import { newLogger } from '@dbux/common/src/log/logger';
import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import { DDGTimelineNode, ContextTimelineNode, PrimitiveTimelineNode, DataTimelineNode, RootTimelineNode } from './DDGTimelineNodes';
import { makeTraceLabel } from '../helpers/makeLabels';

const Verbose = 1;
// const Verbose = 0;


export default class DDGTimelineBuilder {
  /**
   * @type {DDGTimelineNode[]}
   */
  stack;

  /**
   * @type {DDGTimelineNode}
   */
  timelineRoot;

  /**
   * NOTE: {@link DDGTimelineNode#timelineId} indexes this array.
   * @type {DDGTimelineNode[]}
   */
  timelineNodes = [null];

  /**
   * NOTE: {@link BaseDataTimelineNode#dataTimelineId} indexes this array.
   * @type {DataTimelineNode[]}
   */
  timelineDataNodes = [null];

  /**
   * @type {DataTimelineNode[]}
   */
  timelineDataNodesByDataNodeId = [];

  logger;

  /**
   * @param {import('./DataDependencyGraph').default} ddg
   */
  constructor(ddg) {
    this.ddg = ddg;
    this.logger = newLogger('DDGTimelineControlStack');

    const timelineRoot = this.timelineRoot = new RootTimelineNode();
    this.#addNode(timelineRoot);

    /**
     * @type {DDGTimelineNode[]}
     */
    this.stack = [timelineRoot];
  }

  get dp() {
    return this.ddg.dp;
  }

  get root() {
    return this.stack[0];
  }

  peek() {
    return last(this.stack);
  }

  getDataTimelineNodeByDataNodeId(dataNodeId) {
    return this.timelineDataNodesByDataNodeId[dataNodeId];
  }

  /** ###########################################################################
   * create and/or add nodes
   * ##########################################################################*/

  /**
   * NOTE: a trace might induce multiple {@link DDGTimelineNode} in these circumstances:
   *   1. if a DataNode reads or writes an object prop, we add the complete snapshot with all its children
   *   2. a Decision node that is also a Write Node (e.g. `if (x = f())`)
   */
  addTimelineDataNodes(traceId) {
    const { dp } = this;
    const trace = dp.util.getTrace(traceId);
    const dataNodes = dp.util.getDataNodesOfTrace(traceId);
    const ownDataNode = trace.nodeId && dataNodes.find(dataNode => dataNode.nodeId === trace.nodeId);

    if (!ownDataNode) {
      this.logTrace(`NYI: trace did not have own DataNode: "${dp.util.makeTraceInfo(traceId)}"`);
      return;
    }
    // const trace = dp.util.getTraceOfDataNode(dataNodeId);

    // const dataNodeType = dataNode.type; // TODO!
    const label = this.#makeDataNodeLabel(ownDataNode);

    if (DataNodeType.is.Write(ownDataNode.type) && dp.util.isTraceControlDecision(traceId)) {
      // TODO: add two nodes in this case
    }

    // create node based on DDGTimelineNodeType
    let newNode;
    if (ownDataNode.varAccess?.objectNodeId) {
      const refNodeId = ownDataNode.varAccess.objectNodeId;
      // ref type access → add Snapshot
      if (dataNodes.some(dataNode => dataNode.varAccess?.objectNodeId !== refNodeId)) {
        // sanity checks
        this.logTrace(`NYI: trace has multiple dataNodes accessing different objectNodeIds - "${dp.util.makeTraceInfo(traceId)}"`);
      }
      /**
       * 1. implement `construct*ValueSnapshotGraph` + call from here (different from original)
       *    → `getDataTimelineNode(dataNodeId)` // looks up nodes from timeline instead of `DataNodeCollection`
       *    → `getLastTimelineRefSnapshotNode(refId)` // looks up the last snapshot of given ref
       * 2. handle `BCEs`
       * 3. probably get rid of {@link DDGWatchSet#buildSnapshot}
       * 
       * → test w/ `var c = [...a, ...b]` // new graph
       * → test w/ `var c = []; c.push(...a, ...b);`  // clone c's graph (in `push` trace)
       * → test w/ `var c = { x:1, y:2 }; Object.assign(c, a, b);`
       * → test w/ `var c = { x:1, y:2 }; Object.assign(c, {...a, ...b});`
       * → (later) add CircularReferenceNode
       */
    }
    // else if() {
    //   TODO: add DecisionTimelineNode
    // }
    else {
      // primitive value or ref assignment
      // ownDataNode.varAccess.declarationTid;
      if (dataNodes.length > 1) {
        this.logTrace(`NYI: trace has multiple dataNodes but no ref type "${dp.util.makeTraceInfo(traceId)}"`);
      }
      newNode = new PrimitiveTimelineNode(ownDataNode, label);
    }

    // add node
    this.#addDataNode(newNode);

    // add to parent
    const parent = this.peek();
    parent.children.push(newNode);
  }

  /**
   * @param {DataTimelineNode} node 
   */
  #addDataNode(node) {
    node.dataTimelineId = this.timelineDataNodes.length;
    this.timelineDataNodes.push(node);
    this.timelineDataNodesByDataNodeId[node.dataNode.nodeId] = node;

    this.#addNode(node);
  }

  /**
   * @param {DDGTimelineNode} node 
   */
  #addNode(node) {
    node.timelineId = this.timelineNodes.length;
    this.timelineNodes.push(node);
  }

  /** ###########################################################################
   * stack util
   * ##########################################################################*/

  #pushGroup(node) {
    this.#addNode(node);
    this.stack.push(node);
  }

  #popGroup() {
    return this.stack.pop();
  }

  /** ###########################################################################
   * {@link DDGTimelineBuilder#visitTrace}
   * ##########################################################################*/

  visitTrace(traceId) {
    const { dp } = this;
    const trace = dp.util.getTrace(traceId);
    const staticTrace = dp.util.getStaticTrace(traceId);
    if (TraceType.is.PushImmediate(staticTrace.type)) {
      // push context
      this.#pushGroup(new ContextTimelineNode(trace.contextId));
    }
    else if (isTraceControlRolePush(staticTrace.controlRole)) {
      // push branch statement
      // TODO
    }
    else if (dp.util.isTraceControlGroupPop(traceId)) {
      // sanity checks
      if (TraceType.is.PopImmediate(staticTrace.type)) {
        // pop context
        const top = this.peek();
        if (trace.contextId !== top.contextId) {
          this.logTrace(`Invalid pop: expected context=${trace.contextId}, but got: ${top.toString()}`);
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
