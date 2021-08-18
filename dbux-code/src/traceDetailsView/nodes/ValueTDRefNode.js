import allApplications from '@dbux/data/src/applications/allApplications';
import EmptyValueNode from './EmptyValueNode';
import ValueNode, { ValueLabel } from './ValueNode';
import ValueTDSimpleNode from './ValueTDSimpleNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

export default class ValueTDRefNode extends ValueNode {
  /**
   * @param {Trace} trace 
   */
  static makeEntry(trace, parent, props) {
    const { traceId, applicationId } = trace;
    const dp = allApplications.getById(applicationId).dataProvider;
    const dataTrace = dp.util.getValueTrace(traceId);
    const { nodeId } = dataTrace;
    const dataNode = dp.collections.dataNodes.getById(nodeId);
    if (dataNode && dataNode.refId) {
      return dataNode;
    }

    return null;
  }

  /**
   * Make initial props
   */
  static makeProperties({ refId }/*, parent, props*/) {
    return {
      refId,
      key: ValueLabel
    };
  }

  static makeLabel(dataNode, parent, { key }) {
    return `${key}:`;
  }

  get rootDataNode() {
    return this.entry;
  }

  get valueRef() {
    const { refId, dp } = this;
    return dp.collections.values.getById(refId);
  }

  buildChildren() {
    const { rootDataNode, dp, refId } = this;
    const entries = Object.entries(dp.util.constructValueObjectShallow(refId, rootDataNode.nodeId));

    if (entries.length) {
      return entries.map(([key, [childNodeId, childRefId, childValue]]) => {
        if (childRefId) {
          return this.treeNodeProvider.buildNode(
            ValueTDRefNode, rootDataNode, this, { key, refId: childRefId, nodeId: childNodeId }
          );
        }
        else {
          return this.treeNodeProvider.buildNode(
            ValueTDSimpleNode, rootDataNode, this, { key, value: childValue, nodeId: childNodeId }
          );
        }
      });
    }
    else {
      return [EmptyValueNode.instance];
    }
  }

  canHaveChildren() {
    return true;
  }
}