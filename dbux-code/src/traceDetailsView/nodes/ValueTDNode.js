import allApplications from '@dbux/data/src/applications/allApplications';
import ValueTypeCategory from '@dbux/common/src/core/constants/ValueTypeCategory';
// import { isTraceExpression } from '@dbux/common/src/core/constants/TraceType';
import EmptyValueNode from './EmptyValueNode';
import ValueNode from './ValueNode';
import ValueTDLeafNode from './ValueTDLeafNode';

export const noValueMessage = '(no value or undefined)';

export default class ValueTDNode extends ValueNode {
  static makeProperties({ nodeId }, parent, { trace }) {
    const { applicationId } = trace;
    const dp = allApplications.getById(applicationId).dataProvider;
    const value = dp.util.getDataNodeValuePrimitive(nodeId);
    const hasChildren = dp.util.isDataNodeTrackableValue(nodeId);

    return {
      value,
      hasChildren
    };
  }

  static makeLabel(dataNode, parent, { key, trace, value, hasChildren }) {
    // const dp = allApplications.getById(trace.applicationId).dataProvider;
    // const traceType = dp.util.getTraceType(trace.traceId);
    // if (isTraceExpression(traceType) && !hasChildren) {
    if (!!value && !hasChildren) {
      return `${key}: ${JSON.stringify(value)}`;
    }
    return key;
  }

  get valueRef() {
    const { trace: { applicationId }, dataNode: { nodeId } } = this;
    const dp = allApplications.getById(applicationId).dataProvider;
    return dp.util.getDataNodeValueRef(nodeId);
  }

  get dataNode() {
    return this.entry;
  }

  buildChildren() {
    const { hasChildren, trace, dataNode: { nodeId } } = this;
    const selectedNodeId = this.selectedNodeId || nodeId;

    if (hasChildren) {
      const { applicationId } = trace;
      const dp = allApplications.getById(applicationId).dataProvider;
      const entries = Object.entries(dp.util.constructValueObjectShallow(nodeId, selectedNodeId));

      if (entries.length) {
        return entries.map(([key, [entryNodeId, entryValue]]) => {
          // TODO
          if (entryNodeId) {
            const dataNode = dp.collections.dataNodes.getById(entryNodeId);
            return this.treeNodeProvider.maybeBuildTraceDetailNode(ValueTDNode, dataNode, this, { key, trace, selectedNodeId });
          }
          else {
            return this.treeNodeProvider.maybeBuildTraceDetailNode(ValueTDLeafNode, null, this, { key, value: entryValue });
          }
        });
      }
      else {
        return [EmptyValueNode.instance];
      }
    }
    return null;
  }
}