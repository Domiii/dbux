import ValueTypeCategory from '@dbux/common/src/core/constants/ValueTypeCategory';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import { newLogger } from '@dbux/common/src/log/logger';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('ValueTDNode');

export const NoValueMessage = '(no value or undefined)';
export const ValueLabel = 'Value';

export default class ValueNode extends BaseTreeViewNode {
  get clickUserActionType() {
    return UserActionType.TDValueClick;
  }

  get collapseChangeUserActionType() {
    return UserActionType.TDValueCollapseChange;
  }

  init() {
    // hackfix: to show valueRender button in simple logic
    this.contextValue = 'dbuxTraceDetailsView.node.traceValueNode';
    if (this.valueRef) {
      const { category, typeName } = this.valueRef;
      this.description = `${ValueTypeCategory.nameFrom(category)}${typeName && ` (${typeName})`}`;
    }
  }

  handleClick() {
    this.valueRender();
  }

  valueRender() {
    // needs `dp.util.constructValueObjectFull`
    log(`Temporarily disabled.`);
    // const { valueRef, value, hasValue } = this;
    // if (hasValue) {
    //   valueRender(valueRef, value);
    // }
    // else {
    //   valueRender(null, NoValueMessage);
    // }
  }
}