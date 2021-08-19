import BaseNode from './BaseNode';
import { getLValPlugin } from './helpers/lvalUtil';

// ###########################################################################
// util
// ###########################################################################

const LValPluginsByType = {
  Identifier: 'UpdateLValVar',
  MemberExpression: 'UpdateLValME'
};

function getUpdateLValPlugin(node) {
  return getLValPlugin(node, LValPluginsByType);
}


// ###########################################################################
// UpdateExpression
// ###########################################################################

/**
 * @see https://tc39.es/ecma262/#sec-postfix-increment-operator
 */
export default class UpdateExpression extends BaseNode {
  static children = ['argument'];
  static plugins = [
    getUpdateLValPlugin
  ];

  /**
   * @returns {BaseNode}
   */
  getOwnDeclarationNode() {
    const [leftNode] = this.getChildNodes();
    return leftNode.getOwnDeclarationNode();
  }
}
