import TraceType from '@dbux/common/src/types/constants/TraceType';
import BaseNode from './BaseNode';

export default class ConditionalExpression extends BaseNode {
  static children = ['test', 'consequent', 'alternate'];

  exit() {
    const { path } = this;
    const [, result1, result2] = this.getChildPaths();

    const traceData = {
      path,
      node: this,
      staticTraceData: {
        type: TraceType.ExpressionResult,
        dataNode: {
          isNew: false
        }
      }
    };
    this.Traces.addTraceWithInputs(traceData, [result1, result2]);
  }
}