import TraceType from '@dbux/common/src/types/constants/TraceType';
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
    const [idNode] = this.getChildNodes();
    const Function = this.getPlugin('Function');
    const moreTraceData = {
      staticTraceData: Function.createStaticTraceData(idNode.path, TraceType.FunctionDeclaration)
    };

    const declarationNode = this.getOwnDeclarationNode();
    const functionTraceCfg = declarationNode.addOwnDeclarationTrace(declarationNode.path, moreTraceData);
    Function.setFunctionTraceCfg(functionTraceCfg);
  }

  // enter() {
  //   // const { path, Traces } = this;
  //   // const [, initPath] = this.getChildPaths();

  //   const [idNode] = this.getChildNodes();

  //   this.peekStaticContext().addDeclaration(idNode);
  // }
}
