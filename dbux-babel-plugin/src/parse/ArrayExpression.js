import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

/**
 * 
 */
export default class ArrayExpression extends BaseNode {
  static children = ['elements'];

  exit() {
    const { path } = this;

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

    // TODO: SpreadElement
    
    const inputs = path.get('elements');
    // const inputs = [];

    this.Traces.addTraceWithInputs(traceData, inputs);
  }
}