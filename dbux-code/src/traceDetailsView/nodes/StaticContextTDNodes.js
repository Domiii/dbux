import { TreeItemCollapsibleState, TreeItem } from 'vscode';
import allApplications from '@dbux/data/src/applications/allApplications';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import TraceNode from './TraceNode';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';

export default class StaticContextTDNode extends BaseTreeViewNode {
  static makeProperties(trace/* , parent, props */) {
    // build children here since label depends on children
    const { applicationId, contextId } = trace;
    const dp = allApplications.getById(applicationId).dataProvider;
    const { staticContextId } = dp.collections.executionContexts.getById(contextId);
    const contexts = dp.indexes.executionContexts.byStaticContext.get(staticContextId) || EmptyArray;
    const callerTraces = contexts
      .map((context) => dp.util.getCallerTraceOfContext(context.contextId))
      .filter(t => !!t);

    // StaticProgramContext do not have parentTrace and will be filtered
    const label = `Function executed: ${Math.max(callerTraces.length, 1)}x`;

    let collapsibleStateOverride;
    if (callerTraces.length) {
      collapsibleStateOverride = TreeItemCollapsibleState.Collapsed;
    }
    else {
      collapsibleStateOverride = TreeItemCollapsibleState.None;
    }

    return {
      callerTraces,
      label,
      collapsibleStateOverride
    };
  }

  static makeLabel(trace, parent, props) {
    return props.label;
  }

  buildChildren() {
    // use built children in makeProperties
    const nodes = this.callerTraces.map(this.buildCallerTraceNode);
    return nodes;
  }

  buildCallerTraceNode = (callerTrace) => {
    const newNode = this.treeNodeProvider.buildNode(TraceNode, callerTrace, this);
    return newNode;
  }
}