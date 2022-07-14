import * as t from '@babel/types';
import TraceType from '@dbux/common/src/types/constants/TraceType';
// import { pathToString } from '../helpers/pathHelpers';
import BaseNode from './BaseNode';
import BindingIdentifier from './BindingIdentifier';

export default class FunctionDeclaration extends BaseNode {
  static children = ['id', 'params', 'body'];

  static plugins = [
    'Function',
    'StaticContext'
  ];

  /**
   * @returns {BindingIdentifier}
   */
  getOwnDeclarationNode() {
    const [idNode] = this.getChildNodes();
    return idNode;
  }

  // enter() {
  //   const { path } = this;
  //   path.get('id').replaceWith(path.scope.generateUidIdentifier('default'));
  // }

  exit() {
    const { path } = this;

    const idNode = this.getOwnDeclarationNode();
    const Function = this.getPlugin('Function');

    // const scope = this.path.scope.parent;
    // console.warn('func', pathToString(idNode.path), scope.path.node.type, pathToString(scope.path));

    // NOTE: `idNode` can be null. E.g. in: `export default function() { ... }`

    const staticTraceData = Function.createStaticTraceData(
      idNode?.path,
      // NOTE: while this is technically not a `FunctionExpression`, we still treat it as such, since it does not declare a variable binding.
      idNode ? TraceType.FunctionDeclaration : TraceType.FunctionDefinition
    );

    const { scope } = path.parentPath; // prevent adding `tid` variable to own body

    if (idNode) {
      // NOTE: if `FunctionExpression` has an `id`, it is not declared on the outside scope, but still available inside `body`.
      // e.g.: This is legal syntax: `(function f(n) { n && f(--n); })(3)`
      const functionTraceCfg = idNode.addOwnDeclarationTrace(idNode.path, {
        node: this,
        scope,
        staticTraceData
      });

      Function.setFunctionTraceCfg(functionTraceCfg);
    }
    else {
      const traceData = {
        node: this,
        path,
        scope,
        staticTraceData,
        meta: {
          preInstrument() {
            // hackfix
            path.node.type = 'FunctionExpression'; // hackfix!

            // also assign it a name
            //     -> when transforming @babel/preset-env assigns it the name "_default"
            path.node.id = path.scope.generateUidIdentifier('default');
          }
          // targetNode() {
          //   const node = t.cloneNode(path.node);
          //   node.type = 'FunctionExpression';
          //   return node;
          // }
        }
      };

      const functionTraceCfg = this.Traces.addTrace(traceData);
      Function.setFunctionTraceCfg(functionTraceCfg);
    }

    // const functionTraceCfg = idNode.addOwnDeclarationTrace(idNode.path, {
    //   staticTraceData,
    // });
    // Function.setFunctionTraceCfg(functionTraceCfg);
  }

  // enter() {
  //   // const { path, Traces } = this;
  //   // const [, initPath] = this.getChildPaths();

  //   const [idNode] = this.getChildNodes();

  //   this.peekContextNode().addDeclaration(idNode);
  // }
}
