import TraceType from '@dbux/common/src/core/constants/TraceType';
import ParseNode from '../parseLib/ParseNode';

export default class UpdateExpression extends ParseNode {
  static children = ['argument'];

  exit() {
    const { path, Traces } = this;

    // NOTE: argument must be `Identifier` or `ME`
    // const [argumentNode] = this.getChildNodes();
    const childPaths = this.getChildPaths();

    const traceData = {
      path,
      node: this,
      staticTraceData: {
        type: TraceType.ExpressionResult
      }
    };

    Traces.addTraceWithInputs(traceData, childPaths);
  }
}