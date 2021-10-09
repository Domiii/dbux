/**
 * @file Producer/Consumer problem implemented using async/await
 */

import { N, startProduce, finishProduce, startConsume, finishConsume, hasSpace, hasItems, getProduceTime, getConsumeTime, } from './producer_consumer_base';
// import { waitTicksAsync, repeatAsync, sleep } from '../../../util/asyncUtil';

const start = 0, end = 0, work = 0;

/** ###########################################################################
 * wait/notify
 *  #########################################################################*/

const consumerQueue = [];
const producerQueue = [];

async function notify(queue) {
  const next = queue.shift();
  if (next) {
    next();
  }
}

async function wait(queue) {
  const p = new Promise(r => queue.push(r));
  return p;
}

/** ###########################################################################
 * produce
 * ##########################################################################*/

// async function work(x) {
//   x;
//   // console.log(`working on: ${x}`);
// }

async function produce() {
  startProduce();  // WARNING: must start before first await to avoid race condition
  await start;
  const n = getProduceTime();
  for (let i = 0; i < n; ++i) {
    // await work(i);
    await work;
  }
  finishProduce();
  notify(consumerQueue);
  await end;
}

async function waitForSpace() {
  await start;
  return wait(producerQueue);
}

async function P(n) {
  await start;
  for (let i = 0; i < n;) {
    if (hasSpace()) {
      await produce();
      ++i;
    }
    else {
      await waitForSpace();
    }
  }
}

/** ###########################################################################
 * consume
 * ##########################################################################*/

async function consume() {
  startConsume(); // WARNING: must startConsume before first await to avoid race condition
  await start;
  const n = getConsumeTime();
  for (let i = 0; i < n; ++i) {
    // await work(i);
    await work; // keep this
  }
  finishConsume();
  notify(producerQueue);
  await end;
}

async function waitForItems() {
  await start;
  return await wait(consumerQueue);
}

async function C(n) {
  await start;
  for (let i = 0; i < n;) {
    if (hasItems()) {
      await consume();
      ++i;
    }
    else {
      await waitForItems();
    }
  }
}

/** ###########################################################################
 * main
 *  #########################################################################*/

(async function main() {
  await start;
  P(2 * N);
  C(N);
  C(N);
  C(N);
  P(N);
  // tick counter
  for (let i = 0; i < 50; ++i) {
    await 0;
  }
})();
