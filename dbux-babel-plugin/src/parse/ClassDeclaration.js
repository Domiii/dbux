import BaseNode from './BaseNode';

export default class ClassDeclaration extends BaseNode {
  static children = ['id', 'superClass', 'body', 'decorators'];
  static plugins = ['Class'];

  exit1() {
    const [idNode] = this.getChildNodes();
    idNode.addOwnDeclarationTrace(idNode.path);
  }
}