import { pathToString } from '../../helpers/pathHelpers';


const AssignmentLValPluginsByType = {
  Identifier: 'AssignmentLValVar',
  ObjectPattern: 'AssignmentLValPattern',
  ArrayPattern: 'AssignmentLValPattern',
  MemberExpression: 'AssignmentLValME'
};

function getLValPlugin(node, types) {
  const [lvalPath] = node.getChildPaths();
  const lvalType = lvalPath.node.type;
  const pluginName = types[lvalType];
  if (!pluginName) {
    node.logger.error(`unknown lval type: "${lvalType}" at "${pathToString(lvalPath)}"`);
  }
  // console.debug(`[LVAL] lvalType = ${lvalType} - ${pathToString(node.path)}`);
  return pluginName;
}

export function getAssignmentLValPlugin(node) {
  return getLValPlugin(node, AssignmentLValPluginsByType);
}


const DeclaratorLValPluginsByType = {
  Identifier: 'VariableDeclaratorLVal',
  // ObjectPattern: 'AssignmentLValPattern',
  // ArrayPattern: 'AssignmentLValPattern',
  // MemberExpression: 'AssignmentLValME'
};

export function getVariableDeclaratorLValPlugin(node) {
  if (node.path.parentPath.parentPath.isForInStatement()) {
    // NOTE: `ForInStatement` is grand-parent (not parent) of `VariableDeclarator`
    return 'ForInLValVar';
  }

  return getLValPlugin(node, DeclaratorLValPluginsByType);
}