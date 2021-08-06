import TraceType from '@dbux/common/src/types/constants/TraceType';
import { pathToString } from 'src/helpers/pathHelpers';
import BaseNode from './BaseNode';
import BindingIdentifier from './BindingIdentifier';

export default class FunctionDeclaration extends BaseNode {
  static children = ['id', 'params', 'body'];

  static plugins = [
    'Function',
    'StaticContext',
    'BindingNode'
  ];

  /**
   * @returns {BindingIdentifier}
   */
  getOwnDeclarationNode() {
    const [idNode] = this.getChildNodes();
    return idNode;
  }

  exit1() {
    const idNode = this.getOwnDeclarationNode();
    const Function = this.getPlugin('Function');

    const scope = idNode.path.scope.parent;
    // console.warn('func', pathToString(idNode.path), scope.path.node.type, pathToString(scope.path));
    
    const moreTraceData = {
      scope,
      staticTraceData: Function.createStaticTraceData(idNode.path, TraceType.FunctionDeclaration)
    };
    
    const functionTraceCfg = idNode.addOwnDeclarationTrace(idNode.path, moreTraceData);
    Function.setFunctionTraceCfg(functionTraceCfg);
  }

  // enter() {
  //   // const { path, Traces } = this;
  //   // const [, initPath] = this.getChildPaths();

  //   const [idNode] = this.getChildNodes();

  //   this.peekStaticContext().addDeclaration(idNode);
  // }
}
