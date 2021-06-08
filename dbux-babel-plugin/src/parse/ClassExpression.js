import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

export default class ClassExpression extends BaseNode {
  static children = ['id', 'superClass', 'body', 'decorators'];
  static plugins = ['Class'];

  exit() {
    const { path } = this;

    // TODO: check if we have to get the `parent` because else it will add the variable to its own body?
    // const { scope } = path.parentPath;

    const traceData = {
      node: this,
      path,
      // scope,
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