import allApplications from '@dbux/data/src/applications/allApplications';
import ValueTypeCategory from '@dbux/common/src/core/constants/ValueTypeCategory';
import { isTraceExpression } from '@dbux/common/src/core/constants/TraceType';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import isEmpty from 'lodash/isEmpty';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import { makeTreeChildren } from '../../helpers/treeViewHelpers';
import { valueRender } from '../valueRender';

const noValueMessage = '(no value or undefined)';

export default class ValueTDNode extends BaseTreeViewNode {
  static makeTraceDetail(trace/* , parent */) {
    return trace;
  }

  static makeProperties(trace/* , parent, detail */) {
    const { applicationId, traceId } = trace;
    const dp = allApplications.getById(applicationId).dataProvider;
    const hasValue = dp.util.doesTraceHaveValue(traceId);
    const value = hasValue ? dp.util.getTraceValue(traceId) : undefined;
    const valueMessage = hasValue ? dp.util.getTraceValueMessage(traceId) : undefined;
    const hasChildren = dp.util.isTracePlainObjectOrArrayValue(traceId) && !isEmpty(value);

    return {
      value,
      valueMessage,
      hasValue,
      hasChildren
    };
  }

  static makeLabel(trace, parent, { value, valueMessage, hasValue, hasChildren }) {
    const dp = allApplications.getById(trace.applicationId).dataProvider;
    const traceType = dp.util.getTraceType(trace.traceId);
    if (!hasValue) {
      return noValueMessage;
    }
    if (valueMessage) {
      return valueMessage;
    }
    if (isTraceExpression(traceType) && !hasChildren) {
      return `Value: ${JSON.stringify(value)}`;
    }
    return 'Value';
  }

  get clickUserActionType() {
    return UserActionType.TDValueClick;
  }

  get collapseChangeUserActionType() {
    return UserActionType.TDValueCollapseChange;
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
      this.description = `${ValueTypeCategory.nameFrom(valueRef.category)}${valueRef.typeName && ` (${valueRef.typeName})`}`;
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
    const { valueRef, value, hasValue } = this;
    if (hasValue) {
      valueRender(valueRef, value);
    }
    else {
      valueRender(null, noValueMessage);
    }
  }
}