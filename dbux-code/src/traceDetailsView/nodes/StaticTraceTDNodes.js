import { TreeItemCollapsibleState } from 'vscode';
import NanoEvents from 'nanoevents';
import Enum from 'dbux-common/src/util/Enum';
import { EmptyArray } from 'dbux-common/src/util/arrayUtil';
import { makeContextLabel } from 'dbux-data/src/helpers/contextLabels';
import traceSelection from 'dbux-data/src/traceSelection';
import { makeRootTraceLabel, makeCallTraceLabel, makeTraceLabel } from 'dbux-data/src/helpers/traceLabels';
import allApplications from 'dbux-data/src/applications/allApplications';
import TraceType, { hasTraceValue, isCallbackRelatedTrace } from 'dbux-common/src/core/constants/TraceType';
import TraceNode from './TraceNode';
import GroupNode from './GroupNode';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';

const groupByMode = {
  byRunId(app, traces) {
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
  byContextId(app, traces) {
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
  byParentContextTraceId(app, traces) {
    const tracesByParent = [];
    for (const trace of traces) {
      const { contextId } = trace;
      const context = app.dataProvider.collections.executionContexts.getById(contextId);
      const { parentTraceId } = context;
      if (!tracesByParent[parentTraceId]) tracesByParent[parentTraceId] = [];
      tracesByParent[parentTraceId].push(trace);
    }
    const groups = tracesByParent
      .map((children, parentTraceId) => {
        const trace = app.dataProvider.collections.traces.getById(parentTraceId);
        const label = makeTraceLabel(trace) || 'No parent';
        const description = `Parent: ${parentTraceId}`;
        return { label, children, description };
      });
    return groups.filter(group => !!group);
  },
  byCallback(app, traces) {
    const dp = app.dataProvider;
    const tracesByCall = [];
    for (const trace of traces) {
      const { contextId } = trace;
      const context = dp.collections.executionContexts.getById(contextId);
      const { schedulerTraceId } = context;
      const { callId } = dp.collections.traces.getById(schedulerTraceId) || trace;
      if (!tracesByCall[callId]) tracesByCall[callId] = [];
      tracesByCall[callId].push(trace);
    }
    const groups = tracesByCall
      .map((children, callId) => {
        const trace = dp.collections.traces.getById(callId);
        const label = makeCallTraceLabel(trace) || 'No Caller';
        const description = `Call: ${callId}`;
        children = children.filter(({ traceId }) => dp.util.getTraceType(traceId) === TraceType.PushCallback);
        return { label, children, description };
      });
    return groups.filter(group => !!group);
  }
};

const modeType = new Enum({
  byRunId: 1,
  byContextId: 2,
  byParentContextTraceId: 3,
  byCallback: 4
});

const modeTypeToLabel = new Map();
modeTypeToLabel.set(modeType.byRunId, 'by Run');
modeTypeToLabel.set(modeType.byContextId, 'by Context');
modeTypeToLabel.set(modeType.byParentContextTraceId, 'by Parent');
modeTypeToLabel.set(modeType.byCallback, 'by Callback');

let groupingMode = 1;
const modeChangedEvent = new NanoEvents();

function isTraceCallbackRelated(trace) {
  const dp = allApplications.getById(trace.applicationId).dataProvider;
  const type = dp.util.getTraceType(trace.traceId);
  return isCallbackRelatedTrace(type);
}

export { modeType, groupingMode, modeChangedEvent };

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
  modeChangedEvent.emit('changed', modeType.getName(groupingMode));
  return groupingMode;
}

export class StaticTraceTDNode extends BaseTreeViewNode {
  static makeTraceDetail(trace, parent) {
    return trace;
  }

  static makeProperties(trace, parent, detail) {
    const { staticTraceId } = trace;
    const application = allApplications.getById(trace.applicationId);
    const { dataProvider } = application;
    const staticTrace = dataProvider.collections.staticTraces.getById(staticTraceId);
    const traces = dataProvider.indexes.traces.byStaticTrace.get(staticTraceId);
    const staticType = staticTrace.type;
    let groupedTraces = EmptyArray;

    if (hasTraceValue(staticType)) {
      // expressions have return values
      const mode = modeType.getName(groupingMode);
      groupedTraces = groupByMode[mode](application, traces);
    }
    let modeLabel = modeTypeToLabel.get(groupingMode);
    const label = `Executed: ${traces.length}x (${groupedTraces.length} groups ${modeLabel})`;

    return {
      groupedTraces,
      label
    };
  }

  static makeLabel(trace, parent, props) {
    return props.label;
  }

  get defaultCollapsibleState() {
    return TreeItemCollapsibleState.Expanded;
  }

  init() {
    this.contextValue = 'dbuxTraceDetailsView.staticTraceTDNodeRoot';
  }

  buildChildren() {
    const { treeNodeProvider, groupedTraces } = this;

    const nodes = groupedTraces.map((groupData) => {
      const { label, children, description } = groupData;
      const node = new GroupNode(treeNodeProvider, label, null, this);
      if (children.length) {
        node.children = children.map((trace) => {
          const childLabel = makeCallTraceLabel(trace);
          return new TraceNode(treeNodeProvider, childLabel, trace, node);
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