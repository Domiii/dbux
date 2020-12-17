/**
 * @file For `Promise.then` cases, sometimes we want to link the context that creates promise as parent, but sometimes we want to link the executor context as parent.
 */

function g() {
  console.log('g');
}

function h() {
  console.log('h');
}

/**
 * case 1: We expect `delayG` to be the parent of `h`, since promise is created by lib(i.e. `delay`), we can't find the executor context
 */

import { delay } from 'sampleUtil';

function main() {
  return delayG().then(h, h);
}

function delayG() {
  return delay(g, 200);
}

// main();

/**
 * case 2: We expect `g` to be the parent of `h`
 */

function main2() {
  return (new Promise((r) => setTimeout(r, 200))).then(g).then(h)
}

main2();