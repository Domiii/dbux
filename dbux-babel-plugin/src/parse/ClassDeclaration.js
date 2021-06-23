import { traceBehind } from '../instrumentation/trace';
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
    const { path } = this;
    const declarationNode = this.getOwnDeclarationNode();
    declarationNode.addOwnDeclarationTrace(declarationNode.path, {
      meta: {
        hoisted: false,
        keepStatement: true,
        targetPath: path,
        targetNode: declarationNode.path.node,
        instrument: traceBehind
      }
    });
  }
}
