/**
 * Helpers to generate partial AST's.
 */

import { parse } from '@babel/parser';
import { codeFrameColumns } from "@babel/code-frame";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

export function buildTryFinally(tryNodes, finallyNodes) {
  if (tryNodes.length === 1 && t.isBlockStatement(tryNodes[0])) {
    tryNodes = tryNodes[0];
  }
  else {
    tryNodes = t.blockStatement(tryNodes);
  }
  return t.tryStatement(tryNodes, null, t.blockStatement(finallyNodes))
}

export function buildBlock(statements) {
  return t.blockStatement(Array.isArray(statements) ? statements : [statements]);
}

/**
 * Wrap a block with a try/finally pair
 */
export function buildWrapTryFinally(tryNodes, startCalls, endCalls) {
  tryNodes = Array.isArray(tryNodes) ? tryNodes : [tryNodes];
  const finallyBody = endCalls;
  return [
    ...startCalls,
    buildTryFinally(tryNodes, finallyBody)
  ];
}

/**
 * Build AST from source through @babel/parser
 * @param {SourceNode[]} source 
 */
export function buildSource(source) {
  let ast;
  try {
    source = `${source}`;
    ast = parse(source);
  } catch (err) {
    const loc = err.loc;
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

// https://stackoverflow.com/questions/35925798/how-to-add-an-import-to-the-file-with-babel