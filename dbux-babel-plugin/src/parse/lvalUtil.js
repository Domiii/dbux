import { pathToString } from '../helpers/pathHelpers';


// ###########################################################################
// util
// ###########################################################################

const LValPluginsByType = {
  Identifier: 'LValIdentifier',
  ObjectPattern: 'LValPattern',
  ArrayPattern: 'LValPattern',
  MemberExpression: 'LValMemberExpression'
};

export function getLValPlugin(node) {
  const [lvalPath] = node.getChildPaths();
  const lvalType = lvalPath.node.type;
  const pluginName = LValPluginsByType[lvalType];
  if (!pluginName) {
    node.logger.error(`unknown lval type: "${lvalType}" at "${pathToString(lvalPath)}"`);
  }
  // console.debug(`[LVAL] lvalType = ${lvalType} - ${pathToString(node.path)}`);
  return pluginName;
}