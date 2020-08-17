import { TreeItemCollapsibleState } from 'vscode';
import allApplications from '@dbux/data/src/applications/allApplications';
import { isBeforeCallExpression } from '@dbux/common/src/core/constants/TraceType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import TraceValueNode from './TraceValueNode';

/** @typedef {import('@dbux/common/src/core/data/Trace').default} Trace */

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
    const { trace } = this;
    const dp = allApplications.getById(trace.applicationId).dataProvider;
    const traces = dp.indexes.traces.byContext.get(trace.contextId) || EmptyArray;
    const nodes = [];

    for (const childTrace of traces) {
      // filter BCE and no value traces
      const type = dp.util.getTraceType(childTrace.traceId);
      if (isBeforeCallExpression(type)) {
        continue;
      }
      const value = dp.util.getTraceValue(childTrace.traceId);
      if (!value) {
        continue;
      }
      const label = dp.collections.staticTraces.getById(childTrace.staticTraceId).displayName;
      const props = { value };
      const newNode = new TraceValueNode(this.treeNodeProvider, label, childTrace, this, props);
      nodes.push(newNode);
    }

    return nodes;
  }
}