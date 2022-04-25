import { TreeItemCollapsibleState } from 'vscode';
import allApplications from '@dbux/data/src/applications/allApplications';
import { makeContextLabel, makeTraceLabel } from '@dbux/data/src/helpers/makeLabels';
import traceSelection from '@dbux/data/src/traceSelection';
import { emitTDExecutionGroupModeChangedAction } from '../../userEvents';
import BaseTreeViewNode from './BaseTreeViewNode';
import TraceNode from './TraceNode';

/** @typedef {import('@dbux/data/src/RuntimeDataProvider').default} RuntimeDataProvider */
/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */
/** @typedef {import('./TraceNode').default} TraceNode */

export class GroupNode extends BaseTreeViewNode {
  static labelSuffix = '';
  static TraceNodeClass = TraceNode;

  /**
   * @abstract
   * @param {RuntimeDataProvider} dp
   * @param {Trace} trace
   */
  // eslint-disable-next-line no-unused-vars
  static makeKey(dp, trace) {
    throw new Error('abstract method not implemented');
  }

  /**
   * @abstract
   * @param {BaseTreeViewNode} parent
   * @param {object} moreProp
   */
  // eslint-disable-next-line no-unused-vars
  static makeLabel(entry, parent, moreProp) {
    throw new Error('abstract method not implemented');
  }

  static group(traces) {
    const byKey = new Map();
    for (const trace of traces) {
      const dp = allApplications.getById(trace.applicationId).dataProvider;
      const key = this.makeKey(dp, trace);
      if (!byKey.get(key)) byKey.set(key, []);
      byKey.get(key).push(trace);
    }

    return Array.from(byKey.entries());
  }

  static build(rootNode, [key, childTraces]) {
    const { treeNodeProvider } = rootNode;
    return treeNodeProvider.buildNode(this, null, rootNode, { key, childTraces });
  }

  get defaultCollapsibleState() {
    return TreeItemCollapsibleState.Expanded;
  }

  get dp() {
    return allApplications.getById(this.applicationId).dataProvider;
  }

  init() {
    this.description = this.makeDescription?.();
  }

  /**
   * @virtual
   */
  makeDescription() {
    return '';
  }

  handleClick() {
    const relevantTrace = this.getRelevantTrace();
    if (relevantTrace) {
      traceSelection.selectTrace(relevantTrace);
    }
  }

  /**
   * @virtual
   */
  // eslint-disable-next-line no-unused-vars
  getRelevantTrace() {
    return null;
  }

  buildChildren() {
    const { TraceNodeClass } = this.constructor;
    return this.childTraces.map(trace => {
      return this.treeNodeProvider.buildNode(TraceNodeClass, trace, this);
    });
  }
}

/** ###########################################################################
 * GroupNodes implementation
 *  #########################################################################*/

export class UngroupedNode extends GroupNode {
  static group(traces) {
    return traces;
  }

  static build(rootNode, trace) {
    return rootNode.treeNodeProvider.buildNode(this.TraceNodeClass, trace, rootNode);
  }
}

/** ###########################################################################
 * {@link GroupByRootNode}
 * ##########################################################################*/

export class GroupByRootNode extends GroupNode {
  static labelSuffix = 'by Root Context';

  static makeKey(dp, trace) {
    return dp.util.getRootContextOfTrace(trace.traceId).contextId;
  }

  static makeLabel(trace, parent, { key: rootContextId, childTraces }) {
    const { applicationId } = childTraces[0];
    const dp = allApplications.getById(applicationId).dataProvider;
    const context = dp.collections.executionContexts.getById(rootContextId);
    return makeContextLabel(context, dp.application);
  }

  makeDescription() {
    return `Root Context: ${this.key}`;
  }

  getRelevantTrace() {
    const contextId = this.key;
    return this.dp.dataProvider.util.getFirstTraceOfContext(contextId);
  }
}

export class GroupByRealContextNode extends GroupNode {
  static labelSuffix = 'by Real Context';

  static makeKey(dp, trace) {
    return dp.util.getRealContextIdOfContext(trace.contextId);
  }

  static makeLabel(trace, parent, { key: contextId, childTraces }) {
    const { applicationId } = childTraces[0];
    const dp = allApplications.getById(applicationId).dataProvider;
    const context = dp.collections.executionContexts.getById(contextId);
    return makeContextLabel(context, dp.application);
  }

  makeDescription() {
    return `ContextId: ${this.key}`;
  }

  getRelevantTrace(dp, contextId) {
    return dp.dataProvider.util.getFirstTraceOfContext(contextId);
  }
}

export class GroupByCallerNode extends GroupNode {
  static labelSuffix = 'by Caller Trace';

  static makeKey(dp, trace) {
    const { contextId } = trace;
    const callerId = dp.util.getCallerTraceOfContext(contextId)?.traceId || 0;
    return callerId;
  }

  static makeLabel(trace, parent, { key: callerId, childTraces }) {
    const { applicationId } = childTraces[0];
    const dp = allApplications.getById(applicationId).dataProvider;
    const callerTrace = dp.collections.traces.getById(callerId);
    return callerTrace ? makeTraceLabel(callerTrace) : '(No Caller Trace)';
  }

  makeDescription() {
    return `CallerTraceId: ${this.key}`;
  }

  getRelevantTrace(dp, callerId) {
    return dp.dataProvider.collections.traces.getById(callerId);
  }
}

export class GroupByParentContextNode extends GroupNode {
  static labelSuffix = 'by Parent Context';

  static makeKey(dp, trace) {
    let { contextId } = trace;
    contextId = dp.util.getRealContextIdOfContext(trace.contextId);
    return dp.collections.executionContexts.getById(contextId)?.parentContextId || 0;
  }

  static makeLabel(trace, parent, { key: parentContextId, childTraces }) {
    const { applicationId } = childTraces[0];
    const dp = allApplications.getById(applicationId).dataProvider;
    const context = dp.collections.executionContexts.getById(parentContextId);
    return context ? makeContextLabel(context, dp.application) : '(No Parent Context)';
  }

  makeDescription() {
    return `ParentContextId: ${this.key}`;
  }

  getRelevantTrace() {
    const parentContextId = this.key;
    return this.dp.dataProvider.util.getFirstTraceOfContext(parentContextId);
  }
}

// export class GroupByCallbackNode extends ExecutionsGroupNode {
//   static labelSuffix = 'by Callback';

//   static makeKey(dp, trace) {
//     const { contextId } = trace;
//     const dp = application.dataProvider;
//     const { schedulerTraceId } = dp.collections.executionContexts.getById(contextId);
//     const { callId = 0 } = dp.collections.traces.getById(schedulerTraceId) || trace;
//     return callId;
//   }

//   static makeLabel(application, callId) {
//     const trace = application.dp.collections.traces.getById(callId);
//     return trace ? makeCallValueLabel(trace) : '(No Caller)';
//   }

//   makeDescription() {
//     return `Call: ${callId}`;
//   }

//   getRelevantTrace(dp, callId) {
//     return dp.dataProvider.collections.traces.getById(callId);
//   }
// }

/** ###########################################################################
 * TraceContainerNode
 *  #########################################################################*/

/**
 * Containing {@link TraceNode} as children and supports custom grouping.
 * TODO: support cross app trace grouping (consider applictionId in group key)
 */
export default class TraceContainerNode extends BaseTreeViewNode {
  /** ###########################################################################
   * Group mode management
   *  #########################################################################*/
  static GroupClasses = [
    UngroupedNode,
    GroupByRootNode,
    GroupByRealContextNode,
    GroupByCallerNode,
    GroupByParentContextNode,
  ];
  static groupModeIndex = 0;

  static nextGroupMode() {
    this.groupModeIndex = (this.groupModeIndex + 1) % this.GroupClasses.length;
    emitTDExecutionGroupModeChangedAction(this.getCurrentGroupClass().labelSuffix);
  }

  static makeLabel(_entry, _parent, props) {
    const { allTraces, groupNodesData } = props;
    const GroupNodeClass = this.getCurrentGroupClass();
    if (GroupNodeClass.labelSuffix) {
      return `${this.labelPrefix}: ${allTraces?.length || 0}x (${groupNodesData?.length || 0} groups ${GroupNodeClass.labelSuffix})`;
    }
    else {
      return `${this.labelPrefix}: ${allTraces?.length || 0}x`;
    }
  }

  // eslint-disable-next-line no-unused-vars
  static getAllTraces(entry) {
    throw new Error('abstract method not implemented');
  }

  // eslint-disable-next-line no-unused-vars
  static makeProperties(entry, parent, props) {
    const allTraces = this.getAllTraces(entry);
    const GroupNodeClazz = this.getCurrentGroupClass();
    const groupNodesData = GroupNodeClazz.group(allTraces);

    return {
      allTraces,
      groupNodesData,
    };
  }

  static getCurrentGroupClass() {
    return this.GroupClasses[this.groupModeIndex];
  }

  get defaultCollapsibleState() {
    return TreeItemCollapsibleState.Collapsed;
  }

  init() {
    this.contextValue = 'dbux.node.TraceContainerNode';
  }

  buildChildren() {
    // use children built in `makeProperties`
    const { groupNodesData } = this;
    const GroupNodeClass = this.constructor.getCurrentGroupClass();
    return groupNodesData.map(groupNodeData => {
      return GroupNodeClass.build(this, groupNodeData);
    });
  }
}
