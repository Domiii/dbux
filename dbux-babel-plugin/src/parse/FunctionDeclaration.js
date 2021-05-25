import BaseNode from './BaseNode';

export default class FunctionDeclaration extends BaseNode {
  static children = ['id', 'params', 'body'];

  static plugins = [
    'Function',
    'StaticContext',
    'BindingNode'
  ];

  exit1() {
    const [idNode] = this.getChildNodes();
    idNode.addOwnDeclarationTrace();
  }

  // enter() {
  //   // const { path, Traces } = this;
  //   // const [, initPath] = this.getChildPaths();

  //   const [idNode] = this.getChildNodes();

  //   this.peekStaticContext().addDeclaration(idNode);
  // }
}
