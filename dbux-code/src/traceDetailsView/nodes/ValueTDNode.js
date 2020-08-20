import allApplications from '@dbux/data/src/applications/allApplications';
import ValueTypeCategory from '@dbux/common/src/core/constants/ValueTypeCategory';
import { isTraceExpression } from '@dbux/common/src/core/constants/TraceType';
import isEmpty from 'lodash/isEmpty';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import { makeTreeChildren } from '../../helpers/treeViewHelpers';
import { valueRender } from '../valueRender';

export default class ValueTDNode extends BaseTreeViewNode {
  static makeTraceDetail(trace/* , parent */) {
    return trace;
  }

  static makeProperties(trace/* , parent, detail */) {
    const dp = allApplications.getById(trace.applicationId).dataProvider;
    const value = dp.util.getTraceValue(trace.traceId);
    const hasValue = dp.util.doesTraceHaveValue(trace.traceId);
    const hasChildren = dp.util.isTracePlainObjectOrArrayValue(trace.traceId) && !isEmpty(value);

    return {
      value,
      hasValue,
      hasChildren
    };
  }

  static makeLabel(trace, parent, { value, hasValue, hasChildren }) {
    const dp = allApplications.getById(trace.applicationId).dataProvider;
    const traceType = dp.util.getTraceType(trace.traceId);
    if (!hasValue) {
      return '(no value or undefined)';
    }
    if (isTraceExpression(traceType) && !hasChildren) {
      return `Value: ${JSON.stringify(value)}`;
    }
    return 'Value';
  }

  get valueRef() {
    const { trace: { applicationId, traceId } } = this;
    const dp = allApplications.getById(applicationId).dataProvider;
    return dp.util.getTraceValueRef(traceId);
  }

  canHaveChildren() {
    return this.hasChildren;
  }

  init() {
    // hackfix: to show valueRender button in simple logic
    this.contextValue = 'dbuxTraceDetailsView.node.traceValueNode';
    const { valueRef } = this;
    if (valueRef) {
      this.description = ValueTypeCategory.nameFrom(valueRef.category);
    }
  }

  buildChildren() {
    const { value, hasChildren } = this;

    if (hasChildren) {
      return makeTreeChildren(value);
    }
    return null;
  }

  handleClick() {
    this.valueRender();
  }

  valueRender() {
    const { valueRef, value } = this;
    valueRender(valueRef, value);
  }
}