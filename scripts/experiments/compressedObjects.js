// node --expose-gc ./scripts/experiments/compressedObjects.js

// const { memoryUsage } = 'process';
const { performance } = 'perf_hooks';

require('../dbux-register-self');    // add babel-register, so we can import dbux src files
const { startPrettyTimer } = require('@dbux/common-node/src/util/timeUtil');
const { getMemUsageDelta } = require('@dbux/common-node/src/util/memUtil');


const ObjSize = 10;
const ObjCount = 1e6;
const nIterations = 5;
let used;

/** ###########################################################################
 * {@link jsonCreator}
 * ##########################################################################*/

function jsonInit() {
}

function jsonCreator() {
  const obj = {};
  for (let i = 0; i < ObjSize; ++i) {
    obj['a' + i] = i;
  }
  return obj;
}

/** ###########################################################################
 * {@link compiledClassCreator}
 * ##########################################################################*/

let CompiledClass;
let compiledClassCreateFn;

function compiledClassInit() {
  const props = new Array(ObjSize).fill().map((_, i) => 'a' + i);
  CompiledClass = eval(`(class CompiledClass { ${props.map(p => `${p};`).join('\n')}\n })`);
  // console.log('props:', Object.getOwnPropertyNames(new CompiledClass()));
  compiledClassCreateFn = () => new CompiledClass();
}

function compiledClassCreator() {
  const obj = compiledClassCreateFn();
  for (let i = 0; i < ObjSize; ++i) {
    obj['a' + i] = i;
  }
  return obj;
}

/** ###########################################################################
 * {@link main}
 * ##########################################################################*/

function runTest(init, creator) {
  compiledClassInit();
  used = new Array(ObjCount).fill().map(creator);
}


function runOnce(i) {
  used = null;
  gc(); gc(); gc();
  
  console.log('\n\n\n########################\nTest run start', i);
  let mem, label;

  label = 'CompiledClass' + i;
  // printMem(label);
  mem = process.memoryUsage();
  // const timer = startPrettyTimer();
  runTest(compiledClassInit, compiledClassCreator);
  printMem(mem, label);

  used = null;
  gc(); gc(); gc();

  console.log('\n\n');

  label = 'json' + i;
  mem = process.memoryUsage();
  // const timer = startPrettyTimer();
  runTest(jsonInit, jsonCreator);
  printMem(mem, label);


  used = null;
  gc(); gc(); gc();
}

(function main() {
  for (let i = 0; i < nIterations; ++i) {
    runOnce(i + 1);
  }
})();


/** ###########################################################################
 * util
 * ##########################################################################*/

function printMem(mem1, label) {
  const mem2 = process.memoryUsage();
  const delta = getMemUsageDelta(mem2, mem1);
  console.log(`[${label}][MEM]`, JSON.stringify(delta, null, 2));
}
