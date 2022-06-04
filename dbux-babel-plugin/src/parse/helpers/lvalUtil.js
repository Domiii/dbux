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


// const DeclaratorLValPluginsByType = {
//   Identifier: 'VariableDeclaratorLVal',
//   // ObjectPattern: 'AssignmentLValPattern',
//   // ArrayPattern: 'AssignmentLValPattern'
// };

const DefaultLValPlugin = 'VariableDeclaratorLVal';

export function getDeclaratorLValPlugin(node) {
  const declaration = node.path.parentPath;
  const grandParent = declaration.parentPath;
  if (grandParent.isForXStatement() && grandParent.get('left') === declaration) {
    /**
     * `ForXStatement`
     * @see https://babeljs.io/docs/en/babel-types#forxstatement
     */
    return 'ForDeclaratorLVal';
  }

  return DefaultLValPlugin;

  // return getLValPlugin(node, DeclaratorLValPluginsByType);
}