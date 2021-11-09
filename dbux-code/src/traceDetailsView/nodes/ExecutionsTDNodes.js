import { TreeItemCollapsibleState } from 'vscode';
import Enum from '@dbux/common/src/util/Enum';
import traceSelection from '@dbux/data/src/traceSelection';
import { makeTraceLabel, makeTraceValueLabel, makeCallValueLabel, makeContextLabel } from '@dbux/data/src/helpers/makeLabels';
import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import { isCallbackRelatedTrace } from '@dbux/common/src/types/constants/TraceType';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import { emitSelectTraceAction } from '../../userEvents';
import TraceNode from './TraceNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

// ###########################################################################
//  Group Nodes
// ###########################################################################

class BaseGroupNode extends BaseTreeViewNode {
  static labelSuffix = '';

  /**
   * @abstract
   * @param {Application} application
   * @param {Array<Trace>} trace
   */
  // eslint-disable-next-line no-unused-vars
  static makeKey(application, trace) {
    throw new Error('abstract method not implemented');
  }

  /**
   * @abstract
   * @param {string} key
   */
  // eslint-disable-next-line no-unused-vars
  static makeLabel(key) {
    throw new Error('abstract method not implemented');
  }

  /**
   * @param {Array<Trace>} executedTraces
   * @param {Array<Trace>} groupedTraces
   */
  // eslint-disable-next-line no-unused-vars
  static makeRootlabel(executedTraces, groupedTraces) {
    if (this.labelSuffix) {
      return `Executions: ${executedTraces?.length || 0}x (${groupedTraces?.length || 0} groups ${this.labelSuffix})`;
    }
    else {
      return `Executions: ${executedTraces?.length || 0}x`;
    }
  }

  static group(application, traces) {
    const byKey = new Map();
    for (const trace of traces) {
      const key = this.makeKey(application, trace);
      if (!byKey.get(key)) byKey.set(key, []);
      byKey.get(key).push(trace);
    }

    const groupedTraces = Array.from(byKey.entries())
      .map(([key, childTraces]) => {
        const label = this.makeLabel(application, key);
        const description = this.makeDescription(key);
        const relevantTrace = this.makeRelevantTrace?.(application, key);
        return { label, childTraces, description, relevantTrace };
      });

    return groupedTraces;
  }

  static buildNodes(rootNode, groupedTraces) {
    const { treeNodeProvider } = rootNode;
    return groupedTraces.map(({ label, childTraces, description, relevantTrace }) => {
      const groupNode = new this(treeNodeProvider, label, null, rootNode, { description, relevantTrace });
      groupNode.children = buildExecutionNodes(childTraces, groupNode);
      return groupNode;
    });
  }

  constructor(treeNodeProvider, label, entry, parent, moreProps) {
    moreProps = {
      ...moreProps,
      collapsibleState: TreeItemCollapsibleState.Expanded
    };
    super(treeNodeProvider, label, entry, parent, moreProps);
  }

  handleClick() {
    if (this.relevantTrace) {
      traceSelection.selectTrace(this.relevantTrace);
    }
  }
}

class UngroupedNode extends BaseGroupNode {
  static group(application, traces) {
    return traces;
  }

  static buildNodes(rootNode, traces) {
    return buildExecutionNodes(traces, rootNode);
  }
}

class GroupByRootNode extends BaseGroupNode {
  static labelSuffix = 'by Root Context';

  static makeKey(application, trace) {
    return application.dataProvider.util.getRootContextOfTrace(trace.traceId).contextId;
  }

  static makeLabel(application, rootContextId) {
    const context = application.dataProvider.collections.executionContexts.getById(rootContextId);
    return makeContextLabel(context, application);
  }

  static makeDescription(rootContextId) {
    return `Root Context: ${rootContextId}`;
  }

  static makeRelevantTrace(application, rootContextId) {
    return application.dataProvider.util.getFirstTraceOfContext(rootContextId);
  }
}

class GroupByRealContextNode extends BaseGroupNode {
  static labelSuffix = 'by Real Context';

  static makeKey(application, trace) {
    return application.dataProvider.util.getRealContextIdOfContext(trace.contextId);
  }

  static makeLabel(application, contextId) {
    const context = application.dataProvider.collections.executionContexts.getById(contextId);
    return makeContextLabel(context, application);
  }

  static makeDescription(contextId) {
    return `ContextId: ${contextId}`;
  }

  static makeRelevantTrace(application, contextId) {
    return application.dataProvider.util.getFirstTraceOfContext(contextId);
  }
}

class GroupByCallerNode extends BaseGroupNode {
  static labelSuffix = 'by Caller Trace';

  static makeKey(application, trace) {
    const { contextId } = trace;
    const callerId = application.dataProvider.util.getCallerTraceOfContext(contextId)?.traceId || 0;
    return callerId;
  }

  static makeLabel(application, callerId) {
    const trace = application.dataProvider.collections.traces.getById(callerId);
    return trace ? makeTraceLabel(trace) : '(No Caller Trace)';
  }

  static makeDescription(callerId) {
    return `CallerTraceId: ${callerId}`;
  }

  static makeRelevantTrace(application, callerId) {
    return application.dataProvider.collections.traces.getById(callerId);
  }
}

class GroupByParentContextNode extends BaseGroupNode {
  static labelSuffix = 'by Parent Context';

  static makeKey(application, trace) {
    let { contextId } = trace;
    contextId = application.dataProvider.util.getRealContextIdOfContext(trace.contextId);
    return application.dataProvider.collections.executionContexts.getById(contextId)?.parentContextId || 0;
  }

  static makeLabel(application, parentContextId) {
    const context = application.dataProvider.collections.executionContexts.getById(parentContextId);
    return context ? makeContextLabel(context, application) : '(No Parent Context)';
  }

  static makeDescription(parentContextId) {
    return `ParentContextId: ${parentContextId}`;
  }

  static makeRelevantTrace(application, parentContextId) {
    return application.dataProvider.util.getFirstTraceOfContext(parentContextId);
  }
}

class GroupByCallbackNode extends BaseGroupNode {
  static labelSuffix = 'by Callback';

  static makeKey(application, trace) {
    const { contextId } = trace;
    const dp = application.dataProvider;
    const { schedulerTraceId } = dp.collections.executionContexts.getById(contextId);
    const { callId = 0 } = dp.collections.traces.getById(schedulerTraceId) || trace;
    return callId;
  }

  static makeLabel(application, callId) {
    const trace = application.dp.collections.traces.getById(callId);
    return trace ? makeCallValueLabel(trace) : '(No Caller)';
  }

  static makeDescription(callId) {
    return `Call: ${callId}`;
  }

  static makeRelevantTrace(application, callId) {
    return application.dataProvider.collections.traces.getById(callId);
  }
}

// ###########################################################################
//  GroupingMode managment
// ###########################################################################

// eslint-disable-next-line import/no-mutable-exports
let GroupingMode = {
  Ungrouped: 1,
  ByRootContextId: 2,
  ByRealContextId: 3,
  ByCallerTraceId: 4,
  ByParentContextId: 5
  // ByCallback: 6
};
GroupingMode = new Enum(GroupingMode);

// Default mode
let groupingMode = GroupingMode.Ungrouped;

const GroupNodeRegistry = {
  [GroupingMode.Ungrouped]: UngroupedNode,
  [GroupingMode.ByRootContextId]: GroupByRootNode,
  [GroupingMode.ByRealContextId]: GroupByRealContextNode,
  [GroupingMode.ByCallerTraceId]: GroupByCallerNode,
  [GroupingMode.ByParentContextId]: GroupByParentContextNode,
  // [GroupingMode.ByCallback]: GroupByCallbackNode,
};

export function nextMode() {
  groupingMode = GroupingMode.nextValue(groupingMode);
  // if (groupingMode === GroupingMode.ByCallback && !isTraceCallbackRelated(traceSelection.selected)) {
  //   groupingMode = GroupingMode.nextValue(groupingMode);
  // }
  return groupingMode;
}

// ###########################################################################
//  ExecutionTDNode
// ###########################################################################

export default class ExecutionsTDNode extends BaseTreeViewNode {
  static makeLabel(trace, parent, props) {
    return props.label;
  }

  get collapseChangeUserActionType() {
    return UserActionType.TDExecutionsUse;
  }

  get defaultCollapsibleState() {
    return TreeItemCollapsibleState.Collapsed;
  }

  static makeProperties(trace/* , parent, props */) {
    // build children here since label depends on children
    const { applicationId, staticTraceId } = trace;
    const application = allApplications.getById(applicationId);
    const dp = application.dataProvider;
    const traces = dp.indexes.traces.byStaticTrace.get(staticTraceId);
    if (groupingMode === GroupingMode.ByCallback && !isTraceCallbackRelated(trace)) nextMode();

    const GroupNodeClazz = GroupNodeRegistry[groupingMode];
    const groupedTraces = GroupNodeClazz.group(application, traces);
    const label = GroupNodeClazz.makeRootlabel(traces, groupedTraces);

    return {
      groupedTraces,
      label
    };
  }

  init() {
    this.contextValue = 'dbuxTraceDetailsView.node.executionsTDNodeRoot';
  }

  buildChildren() {
    // use children built in `makeProperties`
    const { groupedTraces } = this;
    const GroupNodeClazz = GroupNodeRegistry[groupingMode];
    const groupNodes = GroupNodeClazz.buildNodes(this, groupedTraces);
    return groupNodes;
  }
}

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
//  Util
// ###########################################################################

function isTraceCallbackRelated(trace) {
  const { applicationId, traceId } = trace;
  const dp = allApplications.getById(applicationId).dataProvider;
  const type = dp.util.getTraceType(traceId);
  return isCallbackRelatedTrace(type);
}

function buildExecutionNodes(traces, parent) {
  return traces.map(trace => {
    const label = makeTraceValueLabel(trace);
    const node = new ExecutionNode(parent.treeNodeProvider, label, trace, parent);
    return node;
  });
}