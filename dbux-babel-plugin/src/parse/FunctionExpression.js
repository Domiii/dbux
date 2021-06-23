import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

export default class FunctionExpression extends BaseNode {
  static children = ['id', 'params', 'body'];

  static plugins = [
    'Function',
    'StaticContext'
  ];

  exit() {
    const { path } = this;

    const [idNode] = this.getChildNodes();

    if (idNode) {
      // NOTE: if `FunctionExpression` has an `id`, it is not declared on the outside scope, but still available inside `body`.
      // e.g.: This is legal syntax: `(function f(n) { n && f(--n); })(3)`
      idNode.addOwnDeclarationTrace(idNode.path, {
        meta: {
          hoisted: false,
          targetPath: path
        }
      });
    }
    else {
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
}
