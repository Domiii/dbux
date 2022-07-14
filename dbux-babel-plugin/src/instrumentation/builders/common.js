/**
 * Helpers to generate partial AST's.
 */

import { parse } from '@babel/parser';
import { codeFrameColumns } from "@babel/code-frame";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import isFunction from 'lodash/isFunction';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { UndefinedNode } from './buildUtil';
import { astNodeToString } from '../../helpers/pathHelpers';
import TraceCfg from '../../definitions/TraceCfg';
import { finishAllScopeBlocks, moveScopeBlock } from '../scope';
// import { template } from '@babel/core';

export function buildNamedExport(ids) {
  return t.exportNamedDeclaration(null, ids.map(id => t.exportSpecifier(id, id)));
}


// const errHandlerTemplate = template(`
// console.error(err);
// throw err;
// `);

export function buildBlock(statements) {
  return t.blockStatement(Array.isArray(statements) ? statements : [statements]);
}

export function buildVarDecl(ids) {
  const kind = "let";
  const declarations = ids.map((id) => {
    return t.variableDeclarator(id, null);
  });
  return t.variableDeclaration(kind, declarations);
}

export function buildVarAssignments(ids, values) {
  const assignments = ids.map((id, i) => {
    return t.expressionStatement(t.assignmentExpression('=', id, values[i]));
  });
  return assignments;
}

export function buildProgram(origPathOrNode, bodyNodes) {
  const newProgramNode = t.cloneNode(origPathOrNode.node || origPathOrNode);
  newProgramNode.body = bodyNodes;
  return newProgramNode;
}

/** ###########################################################################
 * try/finally
 *  #########################################################################*/


export function wrapPushPopBlock(bodyPath, pre, post) {
  const newBody = buildBlock([
    ...pre,
    // ...recordParams,
    buildWrapTryFinally(bodyPath.node, post)
  ]);

  // bodyPath.context.create(bodyNode, bodyNode, 'xx')
  bodyPath.replaceWith(newBody);
}

/**
 * @param {NodePath} path 
 * @param {AstNode[]} pops 
 */
export function replaceNodeTryFinallyPop(path, pops) {
  // hackfix: finish scopes first
  finishAllScopeBlocks();

  if (path.parentPath.isLabeledStatement()) {
    // hackfix: don't separate label from loop
    path = path.parentPath;
  }
  const tryNode = buildWrapTryFinally(path.node, pops);
  // bodyPath.context.create(bodyNode, bodyNode, 'xx')
  path.replaceWith(tryNode);
  // moveScopeBlock(path, path.get('block'));
}

/**
 * Wrap a block with a try/finally pair
 */
export function buildWrapTryFinally(tryNodes, finallyBody) {
  tryNodes = Array.isArray(tryNodes) ? tryNodes : [tryNodes];
  return buildTryFinally(tryNodes, finallyBody);
}

export function buildTryFinally(tryNodes, finallyNodes) {
  if (tryNodes.length === 1 && t.isBlockStatement(tryNodes[0])) {
    [tryNodes] = tryNodes; // same as: `tryNodes = tryNodes[0]`
  }
  else {
    tryNodes = t.blockStatement(tryNodes);
  }

  const catchClause = null;
  // const catchClause = t.catchClause(
  //   t.identifier('err'),
  //   t.blockStatement(errHandlerTemplate({
  //   }))
  // );
  return t.tryStatement(tryNodes, catchClause, t.blockStatement(finallyNodes));
}

/** ###########################################################################
 * blocks + bodies
 * ##########################################################################*/

export function ensureBlock(blockPath) {
  if (!Array.isArray(blockPath.node) && !blockPath.isBlock()) {
    blockPath.ensureBlock();
  }
  // bodyPath.unshiftContainer('body', newNode);
}

// ###########################################################################
// buildSource
// ###########################################################################

/**
 * Build AST from source through @babel/parser
 * @param {String} source 
 * @return {SourceNode[]}
 */
export function buildSource(source) {
  let ast;
  try {
    // source = `${source}`;
    ast = parse(source);
  } catch (err) {
    const { loc } = err;
    if (loc) {
      err.message +=
        "\n" +
        codeFrameColumns(source, {
          start: {
            line: loc.line,
            column: loc.column + 1,
          },
        });
    }
    throw err;
  }

  const nodes = ast.program.body;
  nodes.forEach(n => traverse.removeProperties(n));
  return nodes;
}

// ###########################################################################
// utilities
// ###########################################################################

/**
 * @param {TraceCfg} traceCfg 
 */
export function getBuildTargetPath(traceCfg) {
  const {
    meta: {
      targetPath
    } = EmptyObject
  } = traceCfg;
  return targetPath;
}

/**
 * @param {TraceCfg} traceCfg 
 * @return {NodePath}
 */
export function getInstrumentPath(traceCfg) {
  return getBuildTargetPath(traceCfg) || traceCfg.path;
}

/**
 * Get the node that the builder is to work on.
 */
export function getInstrumentTargetAstNode(state, traceCfg) {
  let {
    meta: {
      targetNode
    } = EmptyObject
  } = traceCfg;
  if (isFunction(targetNode)) {
    targetNode = targetNode();
  }
  return targetNode || getInstrumentPath(traceCfg).node || UndefinedNode;
}

export function applyPreconditionToExpression(traceCfg, expr) {
  const { meta } = traceCfg;
  const preCondition = meta?.preCondition;

  if (preCondition) {
    const orig = expr;
    const isStatement = t.isExpressionStatement(orig);
    if (isStatement) {
      expr = orig.expression;
    }
    if (!expr || !t.isExpression(expr)) {
      throw new Error(`Cannot apply 'preCondition' because build result is not an Expression or ExpressionStatement: ${astNodeToString(orig)}`);
    }
    expr = t.logicalExpression('&&', preCondition, expr);
    if (isStatement) {
      expr = t.expressionStatement(expr);
    }
  }
  return expr;
}
