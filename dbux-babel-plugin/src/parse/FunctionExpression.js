import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

export default class FunctionExpression extends BaseNode {
  static plugins = [
    'Function',
    'StaticContext'
  ];

  exit() {
    const { path } = this;

    const traceData = {
      node: this,
      path,
      scope: path.parentPath.scope, // prevent adding `tid` variable to own body
      staticTraceData: {
        type: TraceType.ExpressionResult,
        dataNode: {
          isNew: true
        }
      }
    };

    this.Traces.addTrace(traceData);
  }
}
