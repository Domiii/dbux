/**
 * @file Producer/Consumer problem implemented using async/await
 */
import { N, startProduce, finishProduce, startConsume, finishConsume, hasSpace, hasItems, } from './producer_consumer_base';
// import { waitTicksAsync, repeatAsync, sleep } from '../../../util/asyncUtil';

const start = 0, work = 0, finish = 0;

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
  const [index, item, n] = startProduce();  // WARNING: must start before first await to avoid race condition
  // await start;
  for (let i = 0; i < n; ++i) {
    // await work(i);
    await work;
  }
  await finish;
  finishProduce(index);
  notify(consumerQueue);
  // await end;
}

async function waitForSpace() {
  // await start;
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
  const [index, item, n] = startConsume(); // WARNING: must startConsume before first await to avoid race condition
  // await start;
  for (let i = 0; i < n; ++i) {
    // await work(i);
    await work; // keep this
  }
  await finish;
  finishConsume(index);
  notify(producerQueue);
  // await end;
}

async function waitForItems() {
  // await start;
  return wait(consumerQueue);
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
  // await start;

  P(2 * N);
  C(N);
  C(N);
  C(N);
  P(N);

  // // tick counter
  // for (let counter = 0; counter < 50; ++counter) {
  //   console.log(`==================`);
  //   console.log(``);
  //   console.log(`===== tick#${counter} =====`);
  //   await counter;
  // }
})();
