import allApplications from '@dbux/data/src/applications/allApplications';
import { isTraceExpression } from '@dbux/common/src/core/constants/TraceType';
import ValueTDNode from './ValueTDNode';

const noValueMessage = '(no value or undefined)';

export default class ValueTDRootNode extends ValueTDNode {
  static makeProperties(trace/* , parent, props */) {
    const { applicationId, traceId } = trace;
    const dp = allApplications.getById(applicationId).dataProvider;
    const dataNode = dp.util.getDataNodeOfTrace(traceId);
    const hasValue = !!dataNode;
    const value = hasValue ? dp.util.getTraceValuePrimitive(traceId) : undefined;
    const hasChildren = hasValue ? dp.util.isTracePlainObjectOrArrayValue(traceId) : false;

    return {
      dataNode,
      value,
      hasValue,
      hasChildren
    };
  }

  static makeLabel(trace, parent, { value, hasValue, hasChildren }) {
    const dp = allApplications.getById(trace.applicationId).dataProvider;
    const traceType = dp.util.getTraceType(trace.traceId);
    if (!hasValue) {
      return noValueMessage;
    }
    if (isTraceExpression(traceType) && !hasChildren) {
      return `Value: ${JSON.stringify(value)}`;
    }
    return 'Value';
  }

  get trace() {
    return this.entry;
  }

  get dataNode() {
    return this._dataNode;
  }

  set dataNode(node) {
    this._dataNode = node;
  }
}