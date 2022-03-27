// node --expose-gc ./scripts/experiments/compressedObjects.js

// const { memoryUsage } = 'process';
const { performance } = 'perf_hooks';

require('../dbux-register-self');    // add babel-register, so we can import dbux src files
const { startPrettyTimer } = require('@dbux/common/src/util/timeUtil');
const { getMemUsageDelta } = require('@dbux/common-node/src/util/memUtil');


/**
 * Observations:
 * if ObjSize <= 10, there is no measurable advantage
 * if ObjSize >= 20, compiled memory advantage is 5-7x
 */


const ObjSize = 20;
const ObjCount = 1e5;
const nIterations = 5;
const propPrefix = new Array(100).fill('a').join('');
let allocated;

/** ###########################################################################
 * {@link unstructuredCreator}
 * ##########################################################################*/

function unstructuredInit() {
}

function unstructuredCreator() {
  const obj = {};
  for (let i = 0; i < ObjSize; ++i) {
    obj[propPrefix + i] = i;
  }
  return obj;
}

/** ###########################################################################
 * {@link compiledClassCreator}
 * ##########################################################################*/

let CompiledClass;
let compiledClassCreateFn;

function compiledClassInit() {
  const props = new Array(ObjSize).fill().map((_, i) => propPrefix + i);
  CompiledClass = eval(`(class CompiledClass { ${props.map(p => `${p};`).join('\n')}\n })`);
  // console.log('props:', Object.getOwnPropertyNames(new CompiledClass()));
  compiledClassCreateFn = () => new CompiledClass();
}

function compiledClassCreator() {
  const obj = compiledClassCreateFn();
  for (let i = 0; i < ObjSize; ++i) {
    obj[propPrefix + i] = i;
  }
  return obj;
}

/** ###########################################################################
 * {@link main}
 * ##########################################################################*/

function runTest(init, creator) {
  compiledClassInit();
  allocated = new Array(ObjCount).fill().map(creator);
}


function runOnce(i) {
  allocated = null;
  gc(); gc(); gc();

  console.log('\n\n\n########################\nTest run start', i);
  let mem, label;

  label = 'CompiledClass' + i;
  // printMem(label);
  mem = process.memoryUsage();
  // const timer = startPrettyTimer();
  runTest(compiledClassInit, compiledClassCreator);
  const compiledMem = getMemUsageDelta(mem, process.memoryUsage());
  // printMem(mem, label);

  allocated = null;
  gc(); gc(); gc();

  // console.log('\n\n');

  label = 'unstructured' + i;
  mem = process.memoryUsage();
  // const timer = startPrettyTimer();
  runTest(unstructuredInit, unstructuredCreator);
  const unstructuredMem = getMemUsageDelta(mem, process.memoryUsage());
  printMem(compiledMem, unstructuredMem);


  allocated = null;
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

function prettyK(x) {
  x = (x / 1000).toFixed(2);
  return `${x}k`;
}

function prettyRatio(a, b) {
  a = parseFloat(a);
  b = parseFloat(b);
  if (b < 0.00001) {
    b = 0.00001;
  }
  const ratio = a / b;
  return ratio.toFixed(2);
}

// function printMem(mem1, label) {
//   const mem2 = process.memoryUsage();
//   // const delta = getMemUsageDelta(mem1, mem2);
//   const used = prettyK(mem2.heapUsed - mem1.heapUsed);
//   const total = prettyK(mem2.heapTotal - mem1.heapTotal);

//   // const used = prettyRatio(mem1.heapUsed, mem2.heapUsed);
//   // const total = prettyRatio(mem1.heapTotal, mem2.heapTotal);
//   console.log(`[${label}][MEM]`, `used = ${used}, total = ${total}`);
// }

function printMem(compiledMem, unstructuredMem) {
  // const mem2 = process.memoryUsage();
  // const delta = getMemUsageDelta(mem1, mem2);
  // const used = prettyK(mem2.heapUsed - mem1.heapUsed);
  // const total = prettyK(mem2.heapTotal - mem1.heapTotal);

  const used = prettyRatio(compiledMem.heapUsed, unstructuredMem.heapUsed);
  const total = prettyRatio(compiledMem.heapTotal, unstructuredMem.heapTotal);
  console.log(`[MEM]`, `heapUsed ratio = ${used}, heapTotal ratio = ${total}, unstructured.heapUsed = ${unstructuredMem.heapUsed}, compiledMem.heapUsed = ${compiledMem.heapUsed}`);
}
