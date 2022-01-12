import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { renderValueSimple } from '@dbux/common/src/util/stringUtil';
import allApplications from '@dbux/data/src/applications/allApplications';
import isString from 'lodash/isString';
import { valueRender } from '../valueRender';
import ValueNode, { ValueLabel } from './ValueNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

/**
 * Node contains pure value, use `ValueNode.value` to render
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
  static makeProperties(dataNode, parent, props) {
    if (parent) {
      // NOTE: `value` is already in `props`, and has been computed by a call to `constructValueObjectShallow`
      // const { value, hasValue } = dataNode;
      return {
        // value: hasValue ? value : undefined,
        // rootDataNode: dataNode
      };
    }
    else {
      const { value, hasValue } = dataNode;
      return {
        value: hasValue ? value : undefined,
        // dataNode
      };
    }
  }

  static makeLabel(dataNode, parent, { key, value }) {
    let valueLabel = value;
    if (isString(value)) {
      valueLabel = renderValueSimple(value);
    }
    if (!parent) {
      key = ValueLabel;
    }
    return `${key}: ${valueLabel}`;
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

  valueRender() {
    valueRender(this.value);
  }
}