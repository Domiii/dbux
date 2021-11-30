import EmptyObject from '@dbux/common/src/util/EmptyObject';
import allApplications from '@dbux/data/src/applications/allApplications';
import ValueNode, { ValueLabel } from './ValueNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

/**
 * Node contains pure value, use `V`alueNode.value` to render
 */
export default class ValueTDSimpleNode extends ValueNode {
  /**
   * For root node only.
   * @param {Trace} trace 
   */
  static makeEntry(trace, parent, props) {
    const { traceId, applicationId } = trace;
    const dp = allApplications.getById(applicationId).dataProvider;
    const dataNode = dp.util.getDataNodeOfTrace(traceId);
    if (dataNode && !dataNode.refId) {
      return dataNode;
    }
    if (!dataNode) {
      // render empty value
      return EmptyObject;
    }
    return null;
  }

  /**
   * For root node only.
   */
  static makeProperties(dataNode/*, parent, props*/) {
    const { value, hasValue } = dataNode;
    return {
      key: ValueLabel,
      value: hasValue ? value : undefined,
      rootDataNode: dataNode,
    };
  }

  static makeLabel(dataNode, parent, { key, value }) {
    return `${key}: ${value}`;
  }

  init() {
    super.init();
    
    if (this.value === undefined) {
      this.description = '(no value or undefined)';
    }
  }

  canHaveChildren() {
    return false;
  }
}