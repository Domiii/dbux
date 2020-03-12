import { TreeItemCollapsibleState } from 'vscode';
import { makeContextLabel } from 'dbux-data/src/helpers/contextLabels';
import { makeRootTraceLabel } from 'dbux-data/src/helpers/traceLabels';
import allApplications from 'dbux-data/src/applications/allApplications';
import TraceType, { hasTraceValue } from 'dbux-common/src/core/constants/TraceType';
import { EmptyArray } from 'dbux-common/src/util/arrayUtil';
import TraceNode from './TraceNode';
import GroupNode from './GroupNode';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';

let groupingMode = 'byRunId';

let groupByMode = {
  byRunId(treeNP, app, parent, children) {
    const nodesByRunId = [];
    for (const traceNode of children) {
      const { runId } = traceNode.trace;
      if (!nodesByRunId[runId]) nodesByRunId[runId] = [];
      nodesByRunId[runId].push(traceNode);
    }
    const groupNodes = nodesByRunId
      .map((childrenByRunId, runId) => {
        const firstTraceOfRun = app.dataProvider.util.getFirstTraceOfRun(runId);
        const label = makeRootTraceLabel(firstTraceOfRun);
        return buildGroupNode(treeNP, label, null, parent, childrenByRunId);
      });
    return groupNodes.filter(node => !!node);
  },
  byContextId(treeNP, app, parent, children) {
    const nodesByContextId = [];
    for (const traceNode of children) {
      const { contextId } = traceNode.trace;
      if (!nodesByContextId[contextId]) nodesByContextId[contextId] = [];
      nodesByContextId[contextId].push(traceNode);
    }
    const groupNodes = nodesByContextId
      .map((childrenByContextId, contextId) => {
        const context = app.dataProvider.collections.executionContexts.getById(contextId);
        const label = makeContextLabel(context, app);
        const description = `ContextId: ${contextId}`;
        return buildGroupNode(treeNP, label, context, parent, childrenByContextId, description);
      });
    return groupNodes.filter(node => !!node);
  },
  byParentContextTraceId(treeNP, app, parent, children) {

  },
  callback(treeNP, app, parent, children) {

  }
};

function buildGroupNode(treeNP, label, entry, parent, children, description = '') {
  let newNode = new GroupNode(treeNP, label, entry, parent);
  newNode.children = children;
  newNode.description = description;
  return newNode;
}

export { groupingMode };

export class StaticTraceTDNode extends BaseTreeViewNode {
  static makeTraceDetail(trace, parent) {
    return trace;
  }

  static makeLabel(trace, parent) {
    const { staticTraceId } = trace;

    const application = allApplications.getApplication(trace.applicationId);
    const { dataProvider } = application;
    const traces = dataProvider.indexes.traces.byStaticTrace.get(staticTraceId);
    return `Executed: ${traces.length}x`;
  }

  get defaultCollapsibleState() {
    return TreeItemCollapsibleState.Expanded;
  }

  buildChildren() {
    const { treeNodeProvider, trace } = this;
    const { staticTraceId } = trace;

    const application = allApplications.getById(trace.applicationId);
    const { dataProvider } = application;
    const staticTrace = dataProvider.collections.staticTraces.getById(staticTraceId);
    const traces = dataProvider.indexes.traces.byStaticTrace.get(staticTraceId);

    const staticType = staticTrace.type;
    if (hasTraceValue(staticType)) {
      // expressions have return values
      const childNodes = traces?.map(otherTrace => {
        const valueString = dataProvider.util.getTraceValue(otherTrace.traceId) || '(no returning value)';
        let label;
        if (staticType === TraceType.CallExpressionResult) {
          const anchorId = otherTrace.resultCallId;
          const args = dataProvider.indexes.traces.callArgsByCall.get(anchorId);
          const argValues = args?.
            map(argTrace => dataProvider.util.getTraceValue(argTrace.traceId)) ||
            EmptyArray;
          label = `(${argValues.join(', ')}) -> ${valueString}`;
        }
        else {
          label = valueString;
        }
        return new TraceNode(treeNodeProvider, label, otherTrace, this);
      }) || null;

      return groupByMode[groupingMode](treeNodeProvider, application, this, childNodes);
    }
    return null;
  }
}