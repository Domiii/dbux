/**
 * Helpers to generate partial AST's.
 */

import { parse } from '@babel/parser';
import { codeFrameColumns } from "@babel/code-frame";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

export function buildTryFinally(tryNodes, finallyNodes) {
  return t.tryStatement(t.blockStatement(tryNodes), null, t.blockStatement(finallyNodes))
}

/**
 * Build AST from source through @babel/parser
 * @param {*} source 
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