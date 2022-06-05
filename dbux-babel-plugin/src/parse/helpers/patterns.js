import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import PatternAstNodeType from '@dbux/common/src/types/constants/PatternAstNodeType';
import { newLogger } from '@dbux/common/src/log/logger';
import TraceCfg from '../../definitions/TraceCfg';
import { buildTraceExpressionNoInput, doBuild } from '../../instrumentation/builders/misc';
import { buildTraceId } from '../../instrumentation/builders/traceId';
import { getDeclarationTid } from '../../helpers/traceUtil';
import { pathToStringAnnotated } from '../../helpers/pathHelpers';


// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Pattern Instrumentation');

/** @typedef { import("@babel/types").Node } AstNode */
/** @typedef { import("@babel/traverse").NodePath } NodePath */
/** @typedef { import("@dbux/common/src/types/StaticTrace").default } StaticTrace */
/** @typedef { import("../BaseNode").default } BaseNode */

const Verbose = 2;

export class PatternBuildConfig {
  /**
   * @type {Array.<Function>}
   */
  lvalTreeNodeBuilders = [];
  /**
   * Only: AssignmenLValPattern
   * Used for preparing (nested) lval MEs.
   * @type {Array.<AstNode>}
   */
  preInitTraceCfgs = [];

  addBuilder(buildFn) {
    const index = this.lvalTreeNodeBuilders.length;
    this.lvalTreeNodeBuilders.push(buildFn);
    return index;
  }
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
 * @return {TraceCfg}
 */
export function addPatternTraceCfg(patternCfg, buildFn, traceCfgInput) {
  const { node } = traceCfgInput;
  const traceCfg = node.Traces.addTrace(traceCfgInput);
  return patternCfg.addBuilder(() => buildFn(node.state, traceCfg));
}

/**
 * @param {PatternBuildConfig} patternCfg
 * @param {BaseNode} node
 * @return {number} Index of node in final `treeNodes` array.
 */
export function addPatternChildNode(patternCfg, prop, node) {
  const { path } = node;

  Verbose && debug(`addPatternChildNode: "${node.debugTag}"`);

  if (path.isIdentifier()) {
    // Var
    return addPatternTraceCfg(patternCfg, buildVarNodeAst, {
      node,
      path,
      // scope, // TODO!
      staticTraceData: {
        type: TraceType.PatternWriteVar
      },
      data: { prop },
      meta: {
        build: buildTraceId,
        instrument: null, // disable default instrumentation
      }
    });
  }
  else if (path.isMemberExpression()) {
    // ME
    // TODO: a lot more work necessary here
    // return addPatternTraceCfg(patternCfg, buildMENodeAst, {
    //   node,
    //   path,
    //   // scope, // TODO!
    //   staticTraceData: {
    //     type: TraceType.PatternWriteME
    //   },
    //   meta: {
    //     build: buildTraceId,
    //     instrument: null, // disable default instrumentation
    //   }
    // });
  }
  else if (path.isAssignmentPattern()) {
    // TODO
    throw new Error(`Lval assignment patterns not yet supported, in: "${node.getExistingParent().debugTag}"`);
  }
  else if (path.isRestElement()) {
    // Var or ME
    // TODO
    throw new Error(`Rest patterns not yet supported, in: "${node.getExistingParent().debugTag}"`);
  }
  else if (path.isPattern()) {
    return node.addPatternNode(patternCfg, prop);
  }
  throw new Error(`Unknown lval pattern node found: "${node.debugTag}"`);
}

function buildVarNodeAst(state, traceCfg) {
  const tid = doBuild(state, traceCfg); // ← calls `traceCfg.meta.build`
  const declarationTid = getDeclarationTid(traceCfg);
  return t.objectExpression([
    t.objectProperty(t.stringLiteral('type'), t.numericLiteral(PatternAstNodeType.Var)),
    t.objectProperty(t.stringLiteral('prop'), t.stringLiteral(traceCfg.data.prop + '')),
    t.objectProperty(t.stringLiteral('tid'), tid),
    t.objectProperty(t.stringLiteral('declarationTid'), declarationTid),
  ]);
}

function buildMENodeAst(state, traceCfg) {
  const tid = doBuild(state, traceCfg); // ← calls `traceCfg.meta.build`
  TODO;
  return t.objectExpression([
    t.objectProperty(t.stringLiteral('type'), t.numericLiteral(PatternAstNodeType.ME)),
    t.objectProperty(t.stringLiteral('tid'), tid),
  ]);
}

export function buildArrayNodeAst(prop, childIndexes) {
  return t.objectExpression([
    t.objectProperty(t.stringLiteral('type'), t.numericLiteral(PatternAstNodeType.Array)),
    t.objectProperty(t.stringLiteral('prop'), t.stringLiteral(prop || '')),
    t.objectProperty(t.stringLiteral('children'),
      t.arrayExpression(childIndexes.map(childIndex => t.numericLiteral(childIndex)))
    )
  ]);
}
