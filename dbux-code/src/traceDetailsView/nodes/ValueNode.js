import ValueTypeCategory from '@dbux/common/src/types/constants/ValueTypeCategory';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('ValueTDNode');

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
    // log(`Clicking ValueNode is temporarily disabled.`);
    // const { valueRef, value, hasValue } = this;
    // if (hasValue) {
    //   valueRender(valueRef, value);
    // }
    // else {
    //   valueRender(null, NoValueMessage);
    // }
  }

  selectWriteTrace() {
    const { treeNodeProvider: { trace: { applicationId } } } = this;
    const dp = allApplications.getById(applicationId).dataProvider;
    const writeNode = dp.collections.dataNodes.getById(this.nodeId);
    const writeTrace = dp.collections.traces.getById(writeNode.traceId);

    traceSelection.selectTrace(writeTrace, writeNode.nodeId);
  }

  selectValueCreationTrace() {
    const { treeNodeProvider: { trace: { applicationId } } } = this;
    const dp = allApplications.getById(applicationId).dataProvider;
    const { valueId } = dp.collections.dataNodes.getById(this.nodeId);
    const firstNodeByValue = dp.indexes.dataNodes.byValueId.getFirst(valueId) || EmptyArray;
    if (firstNodeByValue) {
      const firstTraceByValue = dp.collections.traces.getById(firstNodeByValue.traceId);
      traceSelection.selectTrace(firstTraceByValue);
    }
    else {
      logError(`Cannot find value creation trace for dataNode:${JSON.stringify(this.dataNode)}`);
    }
  }
}