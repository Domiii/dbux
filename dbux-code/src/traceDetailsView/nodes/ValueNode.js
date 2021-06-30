import ValueTypeCategory from '@dbux/common/src/core/constants/ValueTypeCategory';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import { valueRender } from '../valueRender';

export const noValueMessage = '(no value or undefined)';

export default class ValueNode extends BaseTreeViewNode {
  get clickUserActionType() {
    return UserActionType.TDValueClick;
  }

  get collapseChangeUserActionType() {
    return UserActionType.TDValueCollapseChange;
  }

  canHaveChildren() {
    return this.hasChildren;
  }

  init() {
    // hackfix: to show valueRender button in simple logic
    this.contextValue = 'dbuxTraceDetailsView.node.traceValueNode';
    if (this.hasValue) {
      const { valueRef } = this;
      if (valueRef) {
        this.description = `${ValueTypeCategory.nameFrom(valueRef.category)}${valueRef.typeName && ` (${valueRef.typeName})`}`;
      }
    }
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