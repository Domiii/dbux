import BaseNode from './BaseNode';
import { getLValPlugin } from './lvalUtil';

// ###########################################################################
// AssignmentExpression
// ###########################################################################

/**
 * 
 */
export default class AssignmentExpression extends BaseNode {
  static children = ['left', 'right'];
  static plugins = [
    getLValPlugin
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