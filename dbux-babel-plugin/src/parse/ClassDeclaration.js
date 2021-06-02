import BaseNode from './BaseNode';

export default class ClassDeclaration extends BaseNode {
  static children = ['id', 'superClass', 'body', 'decorators'];

  exit() {
    const [idNode] = this.getChildNodes();

    // TODO: trace inline (don't push to beginning of block)
    // TODO: also trace value

    idNode.addOwnDeclarationTrace();
  }
}