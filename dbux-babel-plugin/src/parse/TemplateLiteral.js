import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

export default class TemplateLiteral extends BaseNode {
  static children = ['quasis', 'expressions'];

  exit() {
    const { path } = this;
    const [, expressions] = this.getChildPaths();

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

    const inputs = expressions;
    this.Traces.addTraceWithInputs(traceData, inputs);
  }
}