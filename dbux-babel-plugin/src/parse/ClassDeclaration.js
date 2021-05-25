import BaseNode from './BaseNode';

export default class ClassDeclaration extends BaseNode {
  static children = ['id', 'superClass', 'body', 'decorators'];

  exit1() {
    const [idNode] = this.getChildNodes();
    idNode.addOwnDeclarationTrace();
  }
}