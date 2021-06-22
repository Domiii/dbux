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
export default class AssignmentExpression extends BaseNode {
  static children = ['left', 'right'];
  static plugins = [
    {
      plugin: getAssignmentLValPlugin,
      alias: 'lval'
    }
  ];

  /**
   * @returns {BaseNode}
   */
  getDeclarationNode() {
    const [leftNode] = this.getChildNodes();
    return leftNode.getDeclarationNode();
  }

  decorateWriteTraceData(traceData) {
    const { path } = this;
    // const [lvalNode] = this.getChildNodes();

    // traceData.path = lvalNode.path;
    traceData.path = path;
    traceData.node = this;
    traceData.meta.replacePath = path;
  }
}
