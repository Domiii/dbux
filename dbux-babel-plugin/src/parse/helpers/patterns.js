import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import PatternAstNodeType from '@dbux/common/src/types/constants/PatternAstNodeType';
import TraceCfg from '../../definitions/TraceCfg';
import { buildTraceExpressionNoInput, doBuild } from '../../instrumentation/builders/misc';
import { buildTraceId } from '../../instrumentation/builders/traceId';
import { getDeclarationTid } from '../../helpers/traceUtil';

/** @typedef { import("@babel/types").Node } AstNode */
/** @typedef { import("@babel/traverse").NodePath } NodePath */
/** @typedef { import("@dbux/common/src/types/StaticTrace").default } StaticTrace */
/** @typedef { import("../BaseNode").default } BaseNode */

export class PatternBuildConfig {
  /**
   * @type {Array.<AstNode>}
   */
  lvalNodeTraceCfgs = [];
  /**
   * Only: AssignmenLValPattern
   * Used for preparing (nested) lval MEs.
   * @type {Array.<AstNode>}
   */
  preInitTraceCfgs = [];
}

// /**
//  * Cases:
//  * 1. AssignmentLValPattern
//  * 2. DefaultDeclaratorLVal (adds `Write` trace, while VariableDeclarator might add a hoisted `Declaration` trace)
//  * 3. Params
//  * 4. ForDeclaratorLVal (will probably use `Params` logic)
//  *
//  * @param {BaseNode} assignmentNode
//  * @param {BaseNode} patternLvalRoot
//  * @param {BaseNode} rvalNode
//  */
// export function buildPatternTree(assignmentNode, patternLvalRoot, rvalNode) {
// }

/**
 * @param {PatternBuildConfig} patternCfg
 * @param {BaseNode} node
 */
export function buildPatternChildTraceCfg(patternCfg, prop, node) {
  const { path } = node;
  if (path.isIdentifier()) {
    // Var
    const traceCfg = node.Traces.addTrace({
      node,
      path,
      // scope, // TODO!
      staticTraceData: {
        type: TraceType.PatternWriteVar
      },
      meta: {
        build: buildTraceId,
        instrument: null, // disable default instrumentation
        buildPatternNode: buildVarNode
      }
    });
    patternCfg.lvalNodeTraceCfgs.push(traceCfg);
  }
  else if (path.isMemberExpression()) {
    // ME
    patternCfg.lvalNodeTraceCfgs.push(traceCfg);
  }
  else if (path.isAssignmentPattern()) {
    // TODO
  }
  else if (path.isRestElement()) {
    // Var or ME
    patternCfg.lvalNodeTraceCfgs.push(traceCfg);
  }
  else if (path.isPattern()) {
    node.buildPatternTraceCfg(patternCfg, prop);
  }
}

function buildVarNode(state, traceCfg) {
  const tid = doBuild(state, traceCfg);
  const declarationTid = getDeclarationTid(traceCfg);
  return t.objectExpression([
    t.objectProperty(t.stringLiteral('type'), t.numericLiteral(PatternAstNodeType.Var)),
    t.objectProperty(t.stringLiteral('tid'), tid),
    t.objectProperty(t.stringLiteral('declarationTid'), declarationTid),
  ]);
}
