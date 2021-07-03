import { instrumentClassDeclaration } from '../instrumentation/builders/classes';
import BaseNode from './BaseNode';

export default class ClassDeclaration extends BaseNode {
  static children = ['id', 'superClass', 'body', 'decorators'];
  static plugins = ['Class'];


  get classVar() {
    const { path } = this;
    return path.node.id;
  }

  /**
   * @returns {BindingIdentifier}
   */
  getOwnDeclarationNode() {
    const [idNode] = this.getChildNodes();
    return idNode;
  }

  exit1() {
    const { classVar } = this;

    this.getPlugin('Class').addClassTraces({
      data: {
        classVar
      },
      meta: {
        instrument: instrumentClassDeclaration
      }
    });
  }
}
