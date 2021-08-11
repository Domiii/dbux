import allApplications from '@dbux/data/src/applications/allApplications';
import ValueNode, { ValueLabel } from './ValueNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

/**
 * Node contains pure value, no entry(dataNode) available
 */
export default class ValueTDSimpleNode extends ValueNode {
  static makeEntry(trace, parent, props) {
    const { traceId, applicationId } = trace;
    const dp = allApplications.getById(applicationId).dataProvider;
    const dataTrace = dp.util.getValueTrace(traceId);
    const { nodeId } = dataTrace;
    const dataNode = dp.collections.dataNodes.getById(nodeId);
    if (dataNode && !dataNode.refId) {
      return dataNode;
    }
    if (!dataNode) {
      // render empty value
      return {};
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

  init() {
    if (this.entry?.value === undefined) {
      this.description = '(no value or undefined)';
    }
  }

  canHaveChildren() {
    return false;
  }
}