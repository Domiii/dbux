import { TreeItemCollapsibleState } from 'vscode';
import allApplications from 'dbux-data/src/applications/allApplications';
import EmptyArray from 'dbux-common/src/util/EmptyArray';
import TraceNode from './TraceNode';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';

export default class StaticContextTDNode extends BaseTreeViewNode {
  static makeTraceDetail(trace, parent) {
    const { applicationId } = trace;
    return { applicationId };
  }

  static makeProperties(trace, parent, detail) {
    // build children here since label depends on children
    const dp = allApplications.getById(trace.applicationId).dataProvider;
    const { contextId } = trace;
    const { staticContextId } = dp.collections.executionContexts.getById(contextId);
    const contexts = dp.indexes.executionContexts.byStaticContext.get(staticContextId) || EmptyArray;
    const calleeTraces = contexts.map((context) => dp.util.getCalleeTraceOfContext(context.contextId));
    const label = `Function executed: ${contexts.length}x`;

    return {
      calleeTraces,
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
    this.contextValue = 'staticContextTDNodeRoot';
  }

  buildChildren() {
    // use built children in makeProperties
    const nodes = this.calleeTraces.filter(t => !!t).map(this.buildCalleeTraceNode);
    return nodes;
  }

  buildCalleeTraceNode = (calleeTrace) => {
    const newNode = this.treeNodeProvider.buildNode(TraceNode, calleeTrace, this);
    newNode.contextValue = 'StaticContextTraceNode';
    return newNode;
  }
}