import { TreeItemCollapsibleState } from 'vscode';
import allApplications from 'dbux-data/src/applications/allApplications';
import ValueTypeCategory from 'dbux-common/src/core/constants/ValueTypeCategory';
import isEmpty from 'lodash/isEmpty';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import { makeTreeItems, makeTreeChildren } from '../../helpers/treeViewHelpers';
import { isTraceExpression } from 'dbux-common/src/core/constants/TraceType';

export default class ValueTDNode extends BaseTreeViewNode {
  static makeTraceDetail(trace, parent) {
    return trace;
  }

  static makeProperties(trace, parent, detail) {
    const dp = allApplications.getById(trace.applicationId).dataProvider;
    const value = dp.util.getTraceValue(trace.traceId);
    const hasChildren = dp.util.isTracePlainObjectOrArrayValue(trace.traceId) && !isEmpty(value);

    return {
      value,
      hasChildren
    };
  }

  static makeLabel(trace, parent, { value, hasChildren }) {
    const dp = allApplications.getById(trace.applicationId).dataProvider;
    const traceType = dp.util.getTraceType(trace.traceId);
    if (isTraceExpression(traceType) && !hasChildren) {
      return `Value: ${JSON.stringify(value)}`;
    }
    return 'Value';
  }


  canHaveChildren() {
    return this.hasChildren;
  }

  init() {
    const { trace: { applicationId, traceId } } = this;
    const dp = allApplications.getById(applicationId).dataProvider;

    // if (!dp.util.isTracePlainObjectOrArrayValue(traceId)) {
    //   this.description = dp.util.getTraceValueString(traceId);
    // }
    // else 
    {
      const valueRef = dp.util.getTraceValueRef(traceId);
      if (valueRef) {
        this.description = ValueTypeCategory.nameFrom(valueRef.category);
      }
    }
  }

  buildChildren() {
    const { value, hasChildren } = this;

    if (hasChildren) {
      return makeTreeChildren(value);
    }
    return null;
  }
}