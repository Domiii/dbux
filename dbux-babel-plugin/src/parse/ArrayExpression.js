import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

/**
 * 
 */
export default class ArrayExpression extends BaseNode {
  static children = ['elements'];

  exit() {
    const { path } = this;
    const [elements] = this.getChildPaths();

    const traceData = {
      path,
      node: this,
      staticTraceData: {
        type: TraceType.ExpressionResult,
        dataNode: {
          isNew: true
        }
      },
      // meta: {
      //   traceCall: 'traceObjectCreate'
      // }
    };

    // TODO: SpreadElement
    
    const inputs = elements;

    this.Traces.addTraceWithInputs(traceData, inputs);
  }
}