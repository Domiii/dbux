/** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */

import last from 'lodash/last';
import TraceType, { isTraceReturn } from '@dbux/common/src/types/constants/TraceType';
import { isTraceRoleControlPush } from '@dbux/common/src/types/constants/ControlTraceRole';
import { newLogger } from '@dbux/common/src/log/logger';
import { DDGTimelineNode, ContextTimelineNode } from './DDGTimelineNodes';
import DDGTimelineNodeType from './DDGTimelineNodeType';
import { makeTraceLabel } from '../helpers/makeLabels';


// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError, trace: logTrace } = newLogger('DDGTimelineControlStack');

const Verbose = 1;
// const Verbose = 0;


export default class DDGTimelineBuilder {
  /**
   * @type {DDGTimelineNode[]}
   */
  stack;

  /**
   * NOTE: {@link DDGTimelineNode#timelineId} indexes this array.
   * @type {DDGTimelineNode[]}
   */
  timelineNodes = [];

  /**
   * @param {import('./DataDependencyGraph').default} ddg
   */
  constructor(ddg) {
    this.ddg = ddg;

    const rootTimelineNode = new DDGTimelineNode(DDGTimelineNodeType.Root);
    this.#addNode(rootTimelineNode);

    /**
     * @type {DDGTimelineNode[]}
     */
    this.stack = [rootTimelineNode];
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

  addDataNode(dataNodeId) {
    const { dp } = this;
    const dataNode = dp.util.getDataNode(dataNodeId);

    // const dataNodeType = dataNode.type; // TODO!
    const label = this.#makeDataNodeLabel(dataNode);

    // TODO: figure out the DDGTimelineNodeType
    // TODO: add separate dataNodes and dataNodeId (since those are the only ones that can have edges)

    const newNode = new DDGNode(DDGTimelineNodeType.Data, dataNode, label);
    newNode.watched = this.watchSet.isWatchedDataNode(dataNodeId);
    
    this.#addNode(newNode);

    // add to parent
    const parent = this.peek();
    parent.children.push(newNode);
    return newNode;
  }

  /**
   * @param {DDGTimelineNode} node 
   */
  #addNode(node) {
    node.timelineId = this.timelineNodes.length;
    this.timelineNodes.push(node);
  }

  #push(node) {
    this.#addNode(node);
    this.stack.push(node);
  }

  #pop() {
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
      this.#push(new ContextTimelineNode(trace.contextId));
    }
    else if (isTraceRoleControlPush(staticTrace.controlRole)) {
      // push branch statement
      TODO
    }
    else if (dp.util.isTraceControlGroupPop(traceId)) {
      // sanity checks
      if (TraceType.is.PopImmediate(staticTrace.type)) {
        // pop context
        const top = this.peek();
        if (trace.contextId !== top.contextId) {
          logTrace(`Invalid pop: expected context=${trace.contextId}, but got: ${top.toString()}`);
          return;
        }
      }
      else {
        // pop branch statement
        TODO
      }
      this.#pop();
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
