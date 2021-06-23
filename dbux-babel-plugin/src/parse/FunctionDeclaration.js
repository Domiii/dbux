import BaseNode from './BaseNode';

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
    const declarationNode = this.getOwnDeclarationNode();
    declarationNode.addOwnDeclarationTrace(declarationNode.path);
  }

  // enter() {
  //   // const { path, Traces } = this;
  //   // const [, initPath] = this.getChildPaths();

  //   const [idNode] = this.getChildNodes();

  //   this.peekStaticContext().addDeclaration(idNode);
  // }
}
