import allApplications from '@dbux/data/src/applications/allApplications';
import ValueNode, { ValueLabel } from './ValueNode';

/** @typedef {import('@dbux/common/src/core/data/Trace').default} Trace */

/**
 * Node contains pure value, no entry(dataNode) available
 */
export default class ValueTDSimpleNode extends ValueNode {
  static makeEntry(trace, parent, props) {
    const { nodeId, applicationId } = trace;
    const dp = allApplications.getById(applicationId).dataProvider;
    const dataNode = dp.collections.dataNodes.getById(nodeId);
    if (dataNode && !dataNode.refId) {
      return dataNode;
    }

    return null;
  }

  /**
   * Make initial props
   */
  static makeProperties({ value }/*, parent, props*/) {
    return {
      value,
      key: ValueLabel
    };
  }

  static makeLabel(dataNode, parent, { key, value }) {
    return `${key}: ${value}`;
  }

  canHaveChildren() {
    return false;
  }
}