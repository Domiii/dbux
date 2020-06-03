import { TreeItemCollapsibleState } from 'vscode';
import Enum from 'dbux-common/src/util/Enum';
import { makeContextLabel } from 'dbux-data/src/helpers/contextLabels';
import traceSelection from 'dbux-data/src/traceSelection';
import { makeRootTraceLabel, makeTraceLabel, makeTraceValueLabel, makeCallValueLabel } from 'dbux-data/src/helpers/traceLabels';
import allApplications from 'dbux-data/src/applications/allApplications';
import TraceType, { isCallbackRelatedTrace } from 'dbux-common/src/core/constants/TraceType';
import TraceNode from './TraceNode';
import GroupNode from './GroupNode';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';

const groupByMode = {
  ByRunId(app, traces) {
    const tracesByRunId = [];
    for (const trace of traces) {
      const { runId } = trace;
      if (!tracesByRunId[runId]) tracesByRunId[runId] = [];
      tracesByRunId[runId].push(trace);
    }
    const groups = tracesByRunId
      .map((children, runId) => {
        const firstTraceOfRun = app.dataProvider.util.getFirstTraceOfRun(runId);
        const label = makeRootTraceLabel(firstTraceOfRun);
        const description = `Run: ${runId}`;
        return { label, children, description };
      });
    return groups.filter(group => !!group);
  },
  ByContextId(app, traces) {
    const tracesByContextId = [];
    for (const trace of traces) {
      const { contextId } = trace;
      if (!tracesByContextId[contextId]) tracesByContextId[contextId] = [];
      tracesByContextId[contextId].push(trace);
    }
    const groups = tracesByContextId
      .map((children, contextId) => {
        const context = app.dataProvider.collections.executionContexts.getById(contextId);
        const label = makeContextLabel(context, app);
        const description = `ContextId: ${contextId}`;
        return { label, children, description };
      });
    return groups.filter(group => !!group);
  },
  ByParentContextTraceId(app, traces) {
    const tracesByParent = [];
    const dp = app.dataProvider;
    for (const trace of traces) {
      const { contextId } = trace;
      const { parentTraceId = 0 } = dp.collections.executionContexts.getById(contextId);
      if (!tracesByParent[parentTraceId]) tracesByParent[parentTraceId] = [];
      tracesByParent[parentTraceId].push(trace);
    }
    const groups = tracesByParent
      .map((children, parentTraceId) => {
        const trace = app.dataProvider.collections.traces.getById(parentTraceId);
        const label = trace ? makeTraceLabel(trace) : '(No Parent)';
        const description = `Parent: ${parentTraceId}`;
        return { label, children, description };
      });
    return groups.filter(group => !!group);
  },
  ByCallback(app, traces) {
    const dp = app.dataProvider;
    const tracesByCall = [];
    for (const trace of traces) {
      const { contextId } = trace;
      const context = dp.collections.executionContexts.getById(contextId);
      const { schedulerTraceId } = context;
      const { callId = 0 } = dp.collections.traces.getById(schedulerTraceId) || trace;
      if (!tracesByCall[callId]) tracesByCall[callId] = [];
      tracesByCall[callId].push(trace);
    }
    const groups = tracesByCall
      .map((children, callId) => {
        const trace = dp.collections.traces.getById(callId);
        const label = trace ? makeCallValueLabel(trace) : '(No Caller)';
        const description = `Call: ${callId}`;
        children = children.filter(({ traceId }) => dp.util.getTraceType(traceId) === TraceType.PushCallback);
        return { label, children, description };
      });
    return groups.filter(group => !!group);
  }
};

const modeType = new Enum({
  ByRunId: 1,
  ByContextId: 2,
  ByParentContextTraceId: 3,
  ByCallback: 4
});

const modeTypeToLabel = new Map();
modeTypeToLabel.set(modeType.ByRunId, 'by Run');
modeTypeToLabel.set(modeType.ByContextId, 'by Context');
modeTypeToLabel.set(modeType.ByParentContextTraceId, 'by Parent');
modeTypeToLabel.set(modeType.ByCallback, 'by Callback');

let groupingMode = 1;

function isTraceCallbackRelated(trace) {
  const dp = allApplications.getById(trace.applicationId).dataProvider;
  const type = dp.util.getTraceType(trace.traceId);
  return isCallbackRelatedTrace(type);
}

export { modeType, groupingMode };

export function switchMode(mode) {
  if (mode) groupingMode = mode;
  else {
    groupingMode++;
    if (groupingMode === 4 && !isTraceCallbackRelated(traceSelection.selected)) {
      groupingMode = 1;
    }
    else if (groupingMode === 5) {
      groupingMode = 1;
    }
  }
  return groupingMode;
}

export default class StaticTraceTDNode extends BaseTreeViewNode {
  static makeTraceDetail(trace, parent) {
    return trace;
  }

  static makeProperties(trace, parent, detail) {
    // build children here since label depends on children
    const { staticTraceId } = trace;
    const application = allApplications.getById(trace.applicationId);
    const { dataProvider } = application;
    const traces = dataProvider.indexes.traces.byStaticTrace.get(staticTraceId);
    if (groupingMode === modeType.ByCallback && !isTraceCallbackRelated(trace)) switchMode();
    const mode = modeType.getName(groupingMode);
    let groupedTraces = groupByMode[mode](application, traces);
    let modeLabel = modeTypeToLabel.get(groupingMode);
    const label = `Trace Executed: ${traces.length}x (${groupedTraces.length} groups ${modeLabel})`;

    return {
      groupedTraces,
      label
    };
  }

  static makeLabel(trace, parent, props) {
    return props.label;
  }

  get defaultCollapsibleState() {
    return TreeItemCollapsibleState.Collapsed;
  }

  init() {
    this.contextValue = 'dbuxTraceDetailsView.staticTraceTDNodeRoot';
  }

  buildChildren() {
    // use built children in makeProperties
    const { treeNodeProvider, groupedTraces } = this;

    const nodes = groupedTraces.map((groupData) => {
      const { label, children, description } = groupData;
      const node = new GroupNode(treeNodeProvider, label, null, this);
      if (children.length) {
        node.children = children.map((trace) => {
          const childLabel = makeTraceValueLabel(trace);
          const childNode = new TraceNode(treeNodeProvider, childLabel, trace, node);
          childNode.collapsibleState = TreeItemCollapsibleState.Expanded;
          return childNode;
        });
      }
      else {
        node.children = null;
      }
      node.description = description;
      return node;
    });

    return nodes;
  }
}