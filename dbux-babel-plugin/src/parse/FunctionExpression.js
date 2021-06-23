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
