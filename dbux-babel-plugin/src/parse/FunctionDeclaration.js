import TraceType from '@dbux/common/src/core/constants/TraceType';
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
    const moreTraceData = {
      staticTraceData: this.getPlugin('Function').createStaticTraceData(idNode.path)
    };

    const declarationNode = this.getOwnDeclarationNode();
    declarationNode.addOwnDeclarationTrace(declarationNode.path, moreTraceData);
  }

  // enter() {
  //   // const { path, Traces } = this;
  //   // const [, initPath] = this.getChildPaths();

  //   const [idNode] = this.getChildNodes();

  //   this.peekStaticContext().addDeclaration(idNode);
  // }
}
