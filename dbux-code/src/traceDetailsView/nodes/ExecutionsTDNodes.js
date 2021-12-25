import { TreeItemCollapsibleState } from 'vscode';
import { makeTraceLabel, makeContextLabel } from '@dbux/data/src/helpers/makeLabels';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import allApplications from '@dbux/data/src/applications/allApplications';
import { emitSelectTraceAction } from '../../userEvents';
import TraceNode from '../../codeUtil/treeView/TraceNode';
import TraceContainerNode, { GroupNode } from '../../codeUtil/treeView/TraceContainerNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

/** ###########################################################################
 * Leaf Node
 *  #########################################################################*/

class ExecutionNode extends TraceNode {
  get clickUserActionType() {
    return false;
  }

  get defaultCollapsibleState() {
    return TreeItemCollapsibleState.None;
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
    return `Root Context: ${this.key}`;
  }

  getRelevantTrace() {
    const contextId = this.key;
    return this.dp.dataProvider.util.getFirstTraceOfContext(contextId);
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
    return `ContextId: ${this.key}`;
  }

  getRelevantTrace(dp, contextId) {
    return dp.dataProvider.util.getFirstTraceOfContext(contextId);
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
    return `CallerTraceId: ${this.key}`;
  }

  getRelevantTrace(dp, callerId) {
    return dp.dataProvider.collections.traces.getById(callerId);
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
    return `ParentContextId: ${this.key}`;
  }

  getRelevantTrace() {
    const parentContextId = this.key;
    return this.dp.dataProvider.util.getFirstTraceOfContext(parentContextId);
  }
}

// class GroupByCallbackNode extends ExecutionsGroupNode {
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

  getSelectedChildren() {
    if (ExecutionsTDNode.getCurrentGroupClass() === UngroupedNode) {
      return this.children.find(node => node.isSelected());
    }
    else {
      for (const groupNode of this.children) {
        for (const executionNode of groupNode.children) {
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
