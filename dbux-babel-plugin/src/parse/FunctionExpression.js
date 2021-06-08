import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

export default class FunctionExpression extends BaseNode {
  static plugins = [
    'Function',
    'StaticContext'
  ];

  exit() {
    const { path } = this;
    const { scope } = path.parentPath;

    const traceData = {
      node: this,
      path,
      scope,
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
