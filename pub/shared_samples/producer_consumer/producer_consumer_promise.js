import { N, startProduce, finishProduce, startConsume, finishConsume, hasSpace, hasItems, workTicksPromise } from './producer_consumer_base';

/** ###########################################################################
 * wait/notify
 *  #########################################################################*/

const consumerQueue = [];
const producerQueue = [];

function notify(queue) {
  const next = queue.shift();
  if (next) { next(); }
}

function wait(queue) {
  const p = new Promise(r => queue.push(r));
  return p;
}

/** ###########################################################################
 * Basic functions
 *  #########################################################################*/

function consume(index, ticks) {
  // simulate work by waiting
  return workTicksPromise(ticks)
    .then(function finishConsumeAndNotify() {
      finishConsume(index);
      notify(producerQueue);
    });
}

function produce(index, ticks) {
  // simulate work by waiting
  return workTicksPromise(ticks)
    .then(function finishProduceAndNotify() {
      finishProduce(index);
      notify(consumerQueue);
    });
}

function producer(n) {
  function tryProduce() {
    if (!n) {
      return;
    }

    if (hasSpace()) {
      --n
      const [index, item, ticks] = startProduce();
      return produce(index, ticks).then(tryProduce);
    }
    else {
      return wait(producerQueue).then(tryProduce);
    }
  }

  return Promise.resolve().then(tryProduce);
}

function consumer(n) {
  function tryConsume() {
    if (!n) {
      return;
    }

    if (hasItems()) {
      --n;
      const [index, item, ticks] = startConsume();
      return consume(index, ticks).then(tryConsume);
    }
    else {
      return wait(consumerQueue).then(tryConsume);
    }
  }
  return Promise.resolve().then(tryConsume);
}

/** ###########################################################################
 * Main
 *  #########################################################################*/

async function main() {
  producer(2 * N);
  consumer(N);
  consumer(N);
  consumer(N);
  producer(N);

  // // tick counter
  // for (let counter = 0; counter < 50; ++counter) {
  //   // console.log(`==================`);
  //   // console.log(``);
  //   // console.log(`===== tick#${counter} =====`);
  //   await counter;
  // }
}

main();
