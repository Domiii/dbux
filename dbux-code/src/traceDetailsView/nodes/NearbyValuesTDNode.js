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
      const { traceId, staticTraceId } = childTrace;
      const type = dp.util.getTraceType(traceId);
      if (isBeforeCallExpression(type)) {
        // ignore BCEs
        continue;
      }
      const value = dp.util.getTraceValue(traceId);
      if (value === undefined) {
        // ignore undefined
        continue;
      }

      const label = dp.collections.staticTraces.getById(staticTraceId).displayName;

      const valueStr = dp.util.getTraceValueString(traceId);
      if (valueStr === label) {
        // ignore literals
        continue;
      }

      const props = { value };
      const newNode = new TraceValueNode(this.treeNodeProvider, label, childTrace, this, props);
      nodes.push(newNode);
    }

    return nodes;
  }
}