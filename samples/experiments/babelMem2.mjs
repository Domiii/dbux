/**
 * @file Test: `buildDbuxInit` is causing memory pressure that never gets released.
 * However, this test shows that Babel does not leak memory when using `transformSync`.
 * 
 * Run: node --expose-gc babelMem2.mjs
 */

import { transformSync } from '@babel/core';

import { parse } from '@babel/parser';
import { codeFrameColumns } from "@babel/code-frame";
import traverse from "@babel/traverse";

const N = 4e4;


// ###########################################################################
// util
// ###########################################################################

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ###########################################################################
// mem util
// ###########################################################################

function gc() {
  global.gc();
  console.log('gc');
}

// ###########################################################################
// babel plugin + buildSource
// ###########################################################################


function buildSource(source) {
  let ast;
  try {
    source = `${source}`;
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
  // see https://github.com/babel/babel/blob/d98418efbe6f1b4c7ad29a033b3de97f69a5e202/packages/babel-traverse/src/index.ts#L103
  nodes.forEach(n => traverse.default.removeProperties(n));
  return nodes;
}

function plugin2() {
  return {
    visitor: ({
      Program: {
        exit(path, state) {
          const data = [];
          for (let i = 1; i <= N; ++i) {
            data.push({ a: i });
          }
          const injectedCode = `g({ data: ${JSON.stringify(data)} });`;
          path.pushContainer('body', buildSource(injectedCode));
        }
      }
    }),
  };
}

// ###########################################################################
// main
// ###########################################################################

const code = 'f();';

function runWithPlugin(plugin) {
  const babelOptions = {
    plugins: [plugin]
  };
  return transformSync(code, babelOptions);
}

const Delay = 1000;

(async function main() {
  const a = [];
  for (let i = 0; i < 10; ++i) {
    const res = runWithPlugin(plugin2);
    a.push(res.code, res.map);
    await sleep(Delay);
    gc();
    await sleep(Delay);
  }
})();