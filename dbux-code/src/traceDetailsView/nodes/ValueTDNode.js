import allApplications from '@dbux/data/src/applications/allApplications';
import ValueTypeCategory from '@dbux/common/src/core/constants/ValueTypeCategory';
import { isTraceExpression } from '@dbux/common/src/core/constants/TraceType';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import { valueRender } from '../valueRender';
import EmptyValueNode from './EmptyValueNode';


export default class ValueTDNode extends BaseTreeViewNode {
  static makeProperties({ nodeId }, parent, { trace }) {
    const { applicationId, traceId } = trace;
    const dp = allApplications.getById(applicationId).dataProvider;
    const value = dp.util.getDataNodeValuePrimitive(nodeId);
    const hasChildren = dp.util.isDataNodePlainObjectOrArrayValue(nodeId);

    return {
      value,
      hasChildren
    };
  }

  static makeLabel(dataNode, parent, { key, trace, value, hasChildren }) {
    const dp = allApplications.getById(trace.applicationId).dataProvider;
    const traceType = dp.util.getTraceType(trace.traceId);
    if (isTraceExpression(traceType) && !hasChildren) {
      return `${key}: ${JSON.stringify(value)}`;
    }
    return key;
  }

  get clickUserActionType() {
    return UserActionType.TDValueClick;
  }

  get collapseChangeUserActionType() {
    return UserActionType.TDValueCollapseChange;
  }

  get valueRef() {
    const { trace: { applicationId }, dataNode: { nodeId } } = this;
    const dp = allApplications.getById(applicationId).dataProvider;
    return dp.util.getDataNodeValueRef(nodeId);
  }

  get dataNode() {
    return this.entry;
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
    const { hasChildren, trace, dataNode: { nodeId } } = this;
    const selectedNodeId = this.selectedNodeId || nodeId;

    if (hasChildren) {
      const { applicationId } = trace;
      const dp = allApplications.getById(applicationId).dataProvider;
      const entries = Object.entries(dp.util.constructValueObjectShallow(nodeId, selectedNodeId));

      if (entries.length) {
        return entries.map(([key, nodeId]) => {
          const dataNode = dp.collections.dataNodes.getById(nodeId);
          return this.treeNodeProvider.maybeBuildTraceDetailNode(ValueTDNode, dataNode, this, { key, trace, selectedNodeId });
        });
      }
      else {
        return [EmptyValueNode.instance];
      }
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