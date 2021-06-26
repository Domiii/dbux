import TraceType from '@dbux/common/src/core/constants/TraceType';
import { LValHolderNode } from './_types';
import BaseNode from './BaseNode';
import { getAssignmentLValPlugin } from './helpers/lvalUtil';

// ###########################################################################
// AssignmentExpression
// ###########################################################################

/**
 * @implements {LValHolderNode}
 */
export default class AssignmentPattern extends BaseNode {
  static children = ['left', 'right'];

  /**
   * @returns {BaseNode}
   */
  getOwnDeclarationNode() {
    const [leftNode] = this.getChildNodes();
    return leftNode;
  }
}
