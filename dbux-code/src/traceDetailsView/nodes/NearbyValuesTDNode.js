import { TreeItemCollapsibleState } from 'vscode';
import allApplications from '@dbux/data/src/applications/allApplications';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { makeTraceLabel } from '@dbux/data/src/helpers/traceLabels';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import TraceNode from './TraceNode';

export default class NearbyValuesTDNode extends BaseTreeViewNode {
  static makeTraceDetail(trace/* , parent */) {
    return trace;
  }

  static makeLabel(/* trace, parent, props */) {
    return 'Nearby Values';
  }

  get defaultCollapsibleState() {
    return TreeItemCollapsibleState.Collapsed;
  }

  init() {
    this.contextValue = 'dbuxTraceDetailsView.node.nearbyValuesTDNodeRoot';
  }

  buildChildren() {
    const trace = this.entry;
    const dp = allApplications.getById(trace.applicationId).dataProvider;
    const traces = dp.indexes.traces.byContext.get(trace.contextId) || EmptyArray;
    const nodes = [];
    
    for (const childTrace of traces) {
      const value = dp.util.getTraceValue(childTrace.traceId);
      if (value) {
        const label = makeTraceLabel(trace);
        const newNode = new TraceNode(this.treeNodeProvider, label, childTrace, this);
        nodes.push(newNode);
      }
    }

    return nodes;
  }
}