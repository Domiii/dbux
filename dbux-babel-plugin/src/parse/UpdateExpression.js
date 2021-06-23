import { pathToString } from '../helpers/pathHelpers';
import BaseNode from './BaseNode';

// ###########################################################################
// util
// ###########################################################################

const LValPluginsByType = {
  Identifier: 'UpdateLValVar',
  MemberExpression: 'UpdateLValME'
};

function getLValPlugin(node) {
  const [lvalPath] = node.getChildPaths();
  const lvalType = lvalPath.node.type;
  const pluginName = LValPluginsByType[lvalType];
  if (!pluginName) {
    node.logger.error(`unknown lval type: "${lvalType}" at "${pathToString(lvalPath)}"`);
  }
  // console.debug(`[LVAL] lvalType = ${lvalType} - ${pathToString(node.path)}`);
  return pluginName;
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
    getLValPlugin
  ];

  /**
   * @returns {BaseNode}
   */
  getOwnDeclarationNode() {
    const [leftNode] = this.getChildNodes();
    return leftNode.getOwnDeclarationNode();
  }
}
