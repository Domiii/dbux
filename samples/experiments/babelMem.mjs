/**
 * @file This experiment proves that babel does not leak memory.
 * 
 * Run: node --expose-gc babelMem.mjs
 */

import { transformSync } from '@babel/core';

const N = 300e6;


// ###########################################################################
// util
// ###########################################################################

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ###########################################################################
// mem util
// ###########################################################################

function addPressure(a) {
  const I = 3;
  console.log('adding pressure', N * I)

  // NOTE: padStart does not allow that big a number, so we have to run it multiple times.
  for (let i = 0; i < I; ++i) {
    const s = ''.padStart(N, 'l') + 'x';
    a.push(s);

    // NOTE: random access into the string actually allocates it
    // console.log(
    a.map(s => s[N / 2] + s.length).join(', ')
    // );
  }
}

function gc() {
  global.gc();
  console.log('gc');
}

// ###########################################################################
// babeling
// ###########################################################################

const code = "f();";

function runWithPlugin(plugin) {
  const babelOptions = {
    plugins: [plugin]
  };
  return transformSync(code, babelOptions);
}

function bigStatePlugin() {
  return {
    visitor: ({
      Program: {
        exit(path, state) {
          const a = state.a = [];
          addPressure(a);
        }
      }
    }),
  };
}

// ###########################################################################
// main
// ###########################################################################

(async function main() {
  runWithPlugin(bigStatePlugin);
  await sleep(2000);
  gc();
  await sleep(2000);
  runWithPlugin(bigStatePlugin);
  await sleep(2000);
  gc();
  await sleep(2000);
})();