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
      // NOTE: while this is technically not a `FunctionDeclaration`, we still treat it as such, since it still declares its own variable name accessible from within the function itself.
      idNode ? TraceType.FunctionDeclaration : TraceType.FunctionDefinition
    );
    const { scope } = path.parentPath; // prevent adding `tid` variable to own body

    if (idNode) {
      // NOTE: if `FunctionExpression` has an `id`, it is not declared on the outside scope, but still available inside `body`.
      // e.g.: This is legal syntax: `(function f(n) { n && f(--n); })(3)`
      const functionTraceCfg = idNode.addOwnDeclarationTrace(null /* NOTE: unused if not hoisted */, {
        node: this,
        scope,
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
        scope,
        staticTraceData
      };

      const functionTraceCfg = this.Traces.addTrace(traceData);
      Function.setFunctionTraceCfg(functionTraceCfg);
    }
  }
}
