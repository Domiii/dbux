import { instrumentClassDeclaration } from '../instrumentation/builders/classes';
import BaseNode from './BaseNode';

export default class ClassDeclaration extends BaseNode {
  static children = ['id', 'superClass', 'body', 'decorators'];
  static plugins = ['Class'];


  /**
   * @returns {BindingIdentifier}
   */
  getOwnDeclarationNode() {
    const [idNode] = this.getChildNodes();
    return idNode;
  }

  exit1() {
    const [idNode] = this.getChildNodes();

    this.getPlugin('Class').addClassTraces(idNode, {
      meta: {
        instrument: instrumentClassDeclaration
      }
    });
  }
}
