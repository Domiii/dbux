
import BaseNode from './BaseNode';

export default class FunctionDeclaration extends BaseNode {
  static children = ['id', 'params', 'body'];

  static plugins = [
    'Function',
    'StaticContext',
    'BindingNode'
  ];

  exit() {
    // const { path, Traces } = this;
    // const [, initPath] = this.getChildPaths(true);

    const [idNode] = this.getChildNodes();

    this.peekStaticContext().addDeclaration(idNode);
  }
}
