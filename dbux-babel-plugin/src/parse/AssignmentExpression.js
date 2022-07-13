import { LValHolderNode } from './_types';
import BaseNode from './BaseNode';
import { getAssignmentLValPlugin } from './helpers/lvalUtil';

// ###########################################################################
// AssignmentExpression
// ###########################################################################

/**
 * @implements {LValHolderNode}
 */
export default class AssignmentExpression extends BaseNode {
  static children = ['left', 'right'];
  static plugins = [
    {
      plugin: getAssignmentLValPlugin,
      alias: 'lval'
    }
  ];

  isNewValue() {
    return this.path.node.operator !== '=';
  }

  // /**
  //  * @return {true} if operator is += -= ||= etc.
  //  */
  // isItsOwnInput() {
  //   return this.path.node.operator !== '=';
  // }

  /**
   * @returns {BaseNode}
   */
  getOwnDeclarationNode() {
    const [leftNode] = this.getChildNodes();
    return leftNode.getOwnDeclarationNode();
  }

  decorateWriteTraceData(traceData) {
    const { path } = this;
    // const [lvalNode] = this.getChildNodes();

    // traceData.path = lvalNode.path;
    traceData.path = path;
    traceData.node = this;
    traceData.meta.targetPath = path;
  }
}
