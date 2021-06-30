import { instrumentClassExpression } from '../instrumentation/builders/classes';
import BaseNode from './BaseNode';

export default class ClassExpression extends BaseNode {
  static children = ['id', 'superClass', 'body', 'decorators'];
  static plugins = ['Class'];

  exit() {
    const { path } = this;

    // const { scope } = path.parentPath;

    const [idNode] = this.getChildNodes();

    this.getPlugin('Class').addClassTraces(idNode, {
      node: this,
      path,
      scope: path.parentPath.scope, // prevent adding `tid` variable to own body
      meta: {
        instrument: instrumentClassExpression
      }
    });
  }
}