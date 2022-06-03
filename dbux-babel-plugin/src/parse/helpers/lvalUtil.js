import { pathToString } from '../../helpers/pathHelpers';

/** @typedef { import("@babel/types").Node } AstNode */


const AssignmentLValPluginsByType = {
  Identifier: 'AssignmentLValVar',
  MemberExpression: 'AssignmentLValME',
  ObjectPattern: 'AssignmentLValPattern',
  ArrayPattern: 'AssignmentLValPattern'
};

/**
 * 
 * @param {AstNode} node 
 * @param {*} types 
 */
export function getLValPlugin(node, types) {
  const [lvalPath] = node.getChildPaths();
  const lvalType = lvalPath.node.type;
  const pluginName = types[lvalType];
  if (!pluginName) {
    // TODO: if (state.verbose.nyi) { ... }
    // node.logger.warn(`[NYI] lval type: "${lvalType}" at "${pathToString(lvalPath, true)}"`);
    //  in "${pathToString(lvalPath.parentPath)}"
  }
  // console.debug(`[LVAL] lvalType = ${lvalType} - ${pathToString(node.path)}`);
  return pluginName;
}

export function getAssignmentLValPlugin(node) {
  return getLValPlugin(node, AssignmentLValPluginsByType);
}


const DeclaratorLValPluginsByType = {
  Identifier: 'VariableDeclaratorLVal',
  ObjectPattern: 'AssignmentLValPattern',
  ArrayPattern: 'AssignmentLValPattern',
  // MemberExpression: 'AssignmentLValME'
};

export function getVariableDeclaratorLValPlugin(node) {
  if (node.path.parentPath.parentPath.isForInStatement()) {
    // NOTE: `ForInStatement` is grand-parent (not parent) of `VariableDeclarator`
    return 'ForInLValVar';
  }

  return getLValPlugin(node, DeclaratorLValPluginsByType);
}