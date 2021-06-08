import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

/**
 * 
 */
export default class ObjectExpression extends BaseNode {
  /**
   * TODO: associate children `dataPath` with parent's `refId`.
   */

  exit() {
    const { path } = this;

    const { computed } = path.node;

    const traceData = {
      path,
      node: this,
      staticTraceData: {
        type: TraceType.ExpressionResult,
        dataNode: {
          isNew: true
        }
      }
    };

    // TODO: ObjectMethod
    // TODO: ObjectProperty
    // TODO: SpreadElement
    // const inputs = path.get('properties').map(p => p.get('value'));
    const inputs = [];

    this.Traces.addTraceWithInputs(traceData, inputs);
  }
}