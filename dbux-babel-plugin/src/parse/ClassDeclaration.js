import { traceBehind } from '../instrumentation/trace';
import BaseNode from './BaseNode';

export default class ClassDeclaration extends BaseNode {
  static children = ['id', 'superClass', 'body', 'decorators'];
  static plugins = ['Class'];

  exit1() {
    const { path } = this;
    const [idNode] = this.getChildNodes();
    idNode.addOwnDeclarationTrace(idNode.path, {
      meta: {
        hoisted: false,
        keepStatement: true,
        targetPath: path,
        targetNode: idNode.path.node,
        instrument: traceBehind
      }
    });
  }
}
