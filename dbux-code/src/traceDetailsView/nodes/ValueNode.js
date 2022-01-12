// import { getSimpleTypeString } from '@dbux/common/src/types/constants/ValueTypeCategory';
// import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import BaseTreeViewNode from '../../codeUtil/treeView/BaseTreeViewNode';

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

  get nodeId() {
    return this.entry?.nodeId;
  }

  get dp() {
    const { applicationId } = this.trace;
    return allApplications.getById(applicationId).dataProvider;
  }

  init() {
    // hackfix: to show valueRender button in simple logic
    this.contextValue = 'dbuxTraceDetailsView.node.traceValueNode';
  }

  handleClick() {
    this.valueRender();
  }

  valueRender() {
    throw new Error('abstract method not implemented');
  }

  selectWriteTrace() {
    const { dp } = this;
    const writeNode = dp.collections.dataNodes.getById(this.nodeId);
    const writeTrace = dp.collections.traces.getById(writeNode.traceId);

    traceSelection.selectTrace(writeTrace, writeNode.nodeId);
  }

  selectValueCreationTrace() {
    const { dp } = this;
    const valueId = dp.collections.dataNodes.getById(this.nodeId)?.valueId;
    const firstNodeByValue = valueId && dp.indexes.dataNodes.byValueId.getFirst(valueId);
    if (firstNodeByValue) {
      const firstTraceByValue = dp.collections.traces.getById(firstNodeByValue.traceId);
      traceSelection.selectTrace(firstTraceByValue);
    }
    else {
      logError(`Cannot find value creation trace for dataNode:${JSON.stringify(this.dataNode)}`);
    }
  }
}