import allApplications from '@dbux/data/src/applications/allApplications';
import EmptyValueNode from './EmptyValueNode';
import ValueNode, { ValueLabel } from './ValueNode';
import ValueTDSimpleNode from './ValueTDSimpleNode';

/** @typedef {import('@dbux/common/src/core/data/Trace').default} Trace */

export default class ValueTDRefNode extends ValueNode {
  /**
   * @param {Trace} trace 
   */
  static makeEntry(trace, parent, props) {
    const { nodeId, applicationId } = trace;
    const dp = allApplications.getById(applicationId).dataProvider;
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

  get dataNode() {
    return this.entry;
  }

  get valueRef() {
    const { treeNodeProvider: { trace: { applicationId } }, refId } = this;
    const dp = allApplications.getById(applicationId).dataProvider;
    return dp.collections.values.getById(refId);
  }

  buildChildren() {
    const { dataNode, treeNodeProvider: { trace: { applicationId } }, refId } = this;

    const dp = allApplications.getById(applicationId).dataProvider;
    const entries = Object.entries(dp.util.constructValueObjectShallow(refId, dataNode.nodeId));

    if (entries.length) {
      return entries.map(([key, [childNodeId, childRefId, childValue]]) => {
        if (childRefId) {
          return this.treeNodeProvider.buildNode(ValueTDRefNode, dataNode, this, { key, refId: childRefId, nodeId: childNodeId });
        }
        else {
          return this.treeNodeProvider.buildNode(ValueTDSimpleNode, dataNode, this, { key, value: childValue, nodeId: childNodeId });
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