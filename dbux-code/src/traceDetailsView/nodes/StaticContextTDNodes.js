import { TreeItemCollapsibleState, TreeItem } from 'vscode';
import allApplications from '@dbux/data/src/applications/allApplications';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import TraceNode from './TraceNode';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';

export default class StaticContextTDNode extends BaseTreeViewNode {
  static makeTraceDetail(trace/* , parent */) {
    const { applicationId } = trace;
    return { applicationId };
  }

  static makeProperties(trace/* , parent, detail */) {
    // build children here since label depends on children
    const { applicationId, contextId } = trace;
    const dp = allApplications.getById(applicationId).dataProvider;
    const { staticContextId } = dp.collections.executionContexts.getById(contextId);
    const contexts = dp.indexes.executionContexts.byStaticContext.get(staticContextId) || EmptyArray;
    const calleeTraces = contexts
      .map((context) => dp.util.getCallerTraceOfContext(context.contextId))
      .filter(t => !!t);

    // StaticProgramContext do not have parentTrace and will be filtered
    const label = `Function executed: ${Math.max(calleeTraces.length, 1)}x`;

    let collapsibleStateOverride;
    if (calleeTraces.length) {
      collapsibleStateOverride = TreeItemCollapsibleState.Collapsed;
    }
    else {
      collapsibleStateOverride = TreeItemCollapsibleState.None;
    }

    return {
      calleeTraces,
      label,
      collapsibleStateOverride
    };
  }

  static makeLabel(trace, parent, props) {
    return props.label;
  }

  buildChildren() {
    // use built children in makeProperties
    const nodes = this.calleeTraces.map(this.buildCalleeTraceNode);
    return nodes;
  }

  buildCalleeTraceNode = (calleeTrace) => {
    const newNode = this.treeNodeProvider.buildNode(TraceNode, calleeTrace, this);
    return newNode;
  }
}