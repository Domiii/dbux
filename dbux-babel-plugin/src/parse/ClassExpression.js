import { instrumentClassExpression } from '../instrumentation/builders/classes';
import BaseNode from './BaseNode';

export default class ClassExpression extends BaseNode {
  static children = ['id', 'superClass', 'body', 'decorators'];
  static plugins = ['Class'];

  _classVar;

  get classVar() {
    const { path } = this;
    if (!this._classVar) {
      this._classVar = path.scope.generateUidIdentifier(path.node.id?.name || 'anonymous_class');
    }
    return this._classVar;
  }

  getOwnDeclarationNode() {
    const [idNode] = this.getChildNodes();
    return idNode;
  }

  exit() {
    const { path, classVar } = this;

    // const { scope } = path.parentPath;

    // const [idNode] = this.getChildNodes();

    this.getPlugin('Class').addClassTraces({
      scope: path.parentPath.scope, // prevent adding `tid` variable to own body
      data: {
        classVar
      },
      meta: {
        instrument: instrumentClassExpression
      }
    });
  }

  instrument1() {
    const id = this._classVar;
    this.path.parentPath.parentPath.scope.push({
      id
    });
  }
}