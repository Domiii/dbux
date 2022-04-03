import { makeTraceLabel, makeContextLabel, makeTraceValueLabel } from '@dbux/data/src/helpers/makeLabels';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import allApplications from '@dbux/data/src/applications/allApplications';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { emitSelectTraceAction } from '../../userEvents';
import TraceNode from '../../codeUtil/treeView/TraceNode';
import TraceContainerNode, { GroupNode } from '../../codeUtil/treeView/TraceContainerNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

/** ###########################################################################
 * Leaf Node
 *  #########################################################################*/

class ExecutionNode extends TraceNode {
  /**
   * @param {Trace} 
   */
  static makeLabel(trace) {
    return makeTraceValueLabel(trace);
    // return makeTraceLabel(trace);
  }

  handleClick() {
    emitSelectTraceAction(this.trace, UserActionType.TDExecutionsTraceUse);
    super.handleClick();
  }
}

// ###########################################################################
//  Group Nodes
// ###########################################################################

class ExecutionsGroupNode extends GroupNode {
  static labelPrefix = 'Executions';
  static TraceNodeClass = ExecutionNode;
}

class UngroupedNode extends ExecutionsGroupNode {
  static group(application, traces) {
    return traces;
  }

  static build(rootNode, trace) {
    return rootNode.treeNodeProvider.buildNode(this.TraceNodeClass, trace, rootNode);
  }
}

/** ###########################################################################
 * {@link GroupByRootNode}
 * ##########################################################################*/

class GroupByRootNode extends ExecutionsGroupNode {
  static labelSuffix = 'by Root Context';

  static makeKey(dp, trace) {
    return dp.util.getRootContextOfTrace(trace.traceId).contextId;
  }

  static makeLabel(trace, parent, { key: rootContextId, applicationId }) {
    const dp = allApplications.getById(applicationId).dataProvider;
    const context = dp.collections.executionContexts.getById(rootContextId);
    return makeContextLabel(context, dp.application);
  }

  makeDescription() {
    return `root=${this.key}`;
  }

  getRelevantTrace() {
    const contextId = this.key;
    return this.dp.util.getFirstTraceOfContext(contextId);
  }
}

class GroupByRealContextNode extends ExecutionsGroupNode {
  static labelSuffix = 'by Real Context';

  static makeKey(dp, trace) {
    return dp.util.getRealContextIdOfContext(trace.contextId);
  }

  static makeLabel(trace, parent, { key: contextId, applicationId }) {
    const dp = allApplications.getById(applicationId).dataProvider;
    const context = dp.collections.executionContexts.getById(contextId);
    return makeContextLabel(context, dp.application);
  }

  makeDescription() {
    return `context=${this.key}`;
  }

  getRelevantTrace() {
    return this.dp.util.getFirstTraceOfContext(this.key);
  }
}

class GroupByCallerNode extends ExecutionsGroupNode {
  static labelSuffix = 'by Caller Trace';

  static makeKey(dp, trace) {
    const { contextId } = trace;
    const callerId = dp.util.getCallerTraceOfContext(contextId)?.traceId || 0;
    return callerId;
  }

  static makeLabel(trace, parent, { key: callerId, applicationId }) {
    const dp = allApplications.getById(applicationId).dataProvider;
    const callerTrace = dp.collections.traces.getById(callerId);
    return callerTrace ? makeTraceLabel(callerTrace) : '(No Caller Trace)';
  }

  makeDescription() {
    return `caller=${this.key}`;
  }

  getRelevantTrace() {
    return this.dp.collections.traces.getById(this.key);
  }
}

class GroupByParentContextNode extends ExecutionsGroupNode {
  static labelSuffix = 'by Parent Context';

  static makeKey(dp, trace) {
    let { contextId } = trace;
    contextId = dp.util.getRealContextIdOfContext(trace.contextId);
    return dp.collections.executionContexts.getById(contextId)?.parentContextId || 0;
  }

  static makeLabel(trace, parent, { key: parentContextId, applicationId }) {
    const dp = allApplications.getById(applicationId).dataProvider;
    const context = dp.collections.executionContexts.getById(parentContextId);
    return context ? makeContextLabel(context, dp.application) : '(No Parent Context)';
  }

  makeDescription() {
    return `parent=${this.key}`;
  }

  getRelevantTrace() {
    const parentContextId = this.key;
    return this.dp.util.getFirstTraceOfContext(parentContextId);
  }
}

// ###########################################################################
//  ExecutionTDNode
// ###########################################################################

export const ExecutionsTDNodeContextValue = 'dbuxTraceDetailsView.node.executionsTDNodeRoot';

export default class ExecutionsTDNode extends TraceContainerNode {
  static GroupClasses = [
    UngroupedNode,
    GroupByRootNode,
    GroupByRealContextNode,
    GroupByCallerNode,
    GroupByParentContextNode,
    // GroupByCallbackNode,
  ];

  static getAllTraces(trace) {
    const { applicationId, staticTraceId } = trace;
    const application = allApplications.getById(applicationId);
    const dp = application.dataProvider;
    const traces = dp.indexes.traces.byStaticTrace.get(staticTraceId);
    return traces;
  }

  get collapseChangeUserActionType() {
    return UserActionType.TDExecutionsUse;
  }

  init() {
    super.init();
    this.contextValue = ExecutionsTDNodeContextValue;
  }

  getSelectedChild() {
    if (ExecutionsTDNode.getCurrentGroupClass() === UngroupedNode) {
      return this.children?.find(node => node.isSelected());
    }
    else {
      for (const groupNode of this.children) {
        for (const executionNode of groupNode.children || EmptyArray) {
          if (executionNode.isSelected()) {
            return executionNode;
          }
        }
      }
      return null;
    }
  }
}

// ###########################################################################
//  GroupingMode managment
// ###########################################################################

export function nextMode() {
  ExecutionsTDNode.nextGroupMode();
}
