import { pathToString } from '../../helpers/pathHelpers';


const LValPluginsByType = {
  Identifier: 'AssignmentLValVar',
  ObjectPattern: 'AssignmentLValPattern',
  ArrayPattern: 'AssignmentLValPattern',
  MemberExpression: 'AssignmentLValME'
};

export function getAssignmentLValPlugin(node) {
  const [lvalPath] = node.getChildPaths();
  const lvalType = lvalPath.node.type;
  const pluginName = LValPluginsByType[lvalType];
  if (!pluginName) {
    node.logger.error(`unknown lval type: "${lvalType}" at "${pathToString(lvalPath)}"`);
  }
  // console.debug(`[LVAL] lvalType = ${lvalType} - ${pathToString(node.path)}`);
  return pluginName;
}

export function getVariableDeclaratorLValPlugin(node) {
  if (node.getParent().path.isForInStatement()) {
    return 'ForInLValVar';
  }
  return 'AssignmentLValVar';
}