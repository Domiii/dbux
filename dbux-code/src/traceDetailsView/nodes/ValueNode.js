import ValueTypeCategory from '@dbux/common/src/types/constants/ValueTypeCategory';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import { valueRender } from '../valueRender';
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

  get trace() {
    const { treeNodeProvider: { trace } } = this;
    return trace;
  }

  get dp() {
    const { applicationId } = this.trace;
    return allApplications.getById(applicationId).dataProvider;
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
    // log(`Clicking ValueNode is temporarily disabled.`);
    const { dp, entry } = this;

    const nodeId = entry?.nodeId;
    if (!nodeId) {
      return;
    }

    const valueRef = entry.refId && dp.collections.values.getById(entry.refId);
    const value = dp.util.constructValueFull(nodeId);

    valueRender(valueRef, value);
  }

  selectWriteTrace() {
    const { dp } = this;
    const writeNode = dp.collections.dataNodes.getById(this.nodeId);
    const writeTrace = dp.collections.traces.getById(writeNode.traceId);

    traceSelection.selectTrace(writeTrace, writeNode.nodeId);
  }

  selectValueCreationTrace() {
    const { dp } = this;
    const { valueId } = dp.collections.dataNodes.getById(this.nodeId);
    const firstNodeByValue = dp.indexes.dataNodes.byValueId.getFirst(valueId);
    if (firstNodeByValue) {
      const firstTraceByValue = dp.collections.traces.getById(firstNodeByValue.traceId);
      traceSelection.selectTrace(firstTraceByValue);
    }
    else {
      logError(`Cannot find value creation trace for dataNode:${JSON.stringify(this.dataNode)}`);
    }
  }
}