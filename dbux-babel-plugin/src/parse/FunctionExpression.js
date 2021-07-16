import TraceType from '@dbux/common/src/types/constants/TraceType';
import BaseNode from './BaseNode';

export default class FunctionExpression extends BaseNode {
  static children = ['id', 'params', 'body'];

  static plugins = [
    'Function',
    'StaticContext'
  ];

  getOwnDeclarationNode() {
    const [idNode] = this.getChildNodes();
    return idNode;
  }

  exit() {
    const { path } = this;

    const [idNode] = this.getChildNodes();
    const Function = this.getPlugin('Function');
    const staticTraceData = Function.createStaticTraceData(
      idNode?.path,
      idNode ? TraceType.FunctionDeclaration : TraceType.FunctionDefinition
    );

    if (idNode) {
      // NOTE: if `FunctionExpression` has an `id`, it is not declared on the outside scope, but still available inside `body`.
      // e.g.: This is legal syntax: `(function f(n) { n && f(--n); })(3)`
      const functionTraceCfg = idNode.addOwnDeclarationTrace(null /* NOTE: unused if not hoisted */, {
        node: this,
        scope: path.parentPath.scope, // prevent adding `tid` variable to own body
        staticTraceData,
        meta: {
          hoisted: false,
          targetPath: path
        }
      });

      Function.setFunctionTraceCfg(functionTraceCfg);
    }
    else {
      const traceData = {
        node: this,
        path,
        scope: path.parentPath.scope, // prevent adding `tid` variable to own body
        staticTraceData
      };

      const functionTraceCfg = this.Traces.addTrace(traceData);
      Function.setFunctionTraceCfg(functionTraceCfg);
    }
  }
}
