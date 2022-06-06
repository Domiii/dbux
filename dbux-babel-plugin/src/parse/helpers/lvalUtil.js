/** @typedef { import("@babel/types").Node } AstNode */

import SyntaxType from '@dbux/common/src/types/constants/SyntaxType';
import TraceType from '@dbux/common/src/types/constants/TraceType';
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

export function makeLValVarTrace(node, path, targetPath, syntax, isNew, rvalPath) {
  const traceData = {
    node,
    path,
    staticTraceData: {
      type: TraceType.WriteVar,
      syntax,
      dataNode: {
        isNew
      }
    },
    meta: {
      // instrument: Traces.instrumentTraceWrite
      build: buildTraceWriteVar,
      targetPath
    }
  };

  // NOTE: `declarationTid` comes from `node.getDeclarationNode`
  if (rvalPath) {
    return node.Traces.addTraceWithInputs(traceData, [rvalPath]);
  }
  else {
    return node.Traces.addTrace(traceData);
  }
}
