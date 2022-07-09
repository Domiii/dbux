/** @typedef { import("@babel/types").Node } AstNode */

import merge from 'lodash/merge';
import { buildTraceWriteVar } from '../../instrumentation/builders/misc';


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

const DefaultLValPlugin = 'DefaultDeclaratorLVal';

/**
 * NOTE: this is called by the declarator
 * 
 * @param {VariableDeclarator} node 
 */
export function getDeclaratorLValPlugin(node) {
  // NOTE: this will run very early, so we don't have access to `getChildNodes`
  const [idPath] = node.getChildPaths();

  // Pattern
  if (idPath.isPattern()) {
    return 'DeclaratorLValPattern';
  }

  // ForX
  const declaration = node.path.parentPath;
  const grandParent = declaration.parentPath;
  if (grandParent.isForXStatement()) {
    /**
     * `ForXStatement`
     * @see https://babeljs.io/docs/en/babel-types#forxstatement
     */
    return 'ForDeclaratorLVal';
  }

  return DefaultLValPlugin;

  // return getLValPlugin(node, DeclaratorLValPluginsByType);
}

export function addLValVarTrace(node, path, traceType, targetPath, rvalPath, traceData) {
  traceData = merge(
    {
      node,
      path,
      staticTraceData: {
        type: traceType
      },
      meta: {
        // instrument: Traces.instrumentTraceWrite
        build: buildTraceWriteVar,
        targetPath
      }
    },
    traceData
  );

  // NOTE: `declarationTid` comes from `node.getDeclarationNode`
  if (rvalPath) {
    return node.Traces.addTraceWithInputs(traceData, [rvalPath]);
  }
  else {
    return node.Traces.addTrace(traceData);
  }
}
