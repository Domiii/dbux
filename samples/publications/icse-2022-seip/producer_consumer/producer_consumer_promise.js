import { IdleTime, N, startProduce, finishProduce, startConsume, finishConsume, hasSpace, hasItems } from './producer_consumer_base';
import { waitTicksPromise, repeatPromise } from '../../../util/asyncUtil';

/** ###########################################################################
 * wait/notify
 *  #########################################################################*/

const consumerQueue = [];
const producerQueue = [];

function notify(queue) {
  const next = queue.shift();
  if (next) {
    next();
  }
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
  return waitTicksPromise(ticks)
    .then(function _finishConsume() {
      finishConsume(index);
      notify(producerQueue);
    });
}

function produce(index, ticks) {
  // simulate work by waiting
  return waitTicksPromise(ticks)
    .then(function _finishProduce() {
      finishProduce(index);
      notify(consumerQueue);
    });
}

function producer(n) {
  return repeatPromise(
    () => !!n,
    function tryProduce() {
      if (hasSpace()) {
        --n
        const [index, item, ticks] = startProduce();
        return produce(index, ticks);
      }
      else {
        return wait(producerQueue);
      }
    }
  );
}

function consumer(n) {
  return repeatPromise(
    () => !!n,
    function tryConsume() {
      if (hasItems()) {
        --n;
        const [index, item, ticks] = startConsume();
        return consume(index, ticks);
      }
      else {
        return wait(consumerQueue);
      }
    }
  );
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

  // tick counter
  for (let counter = 0; counter < 50; ++counter) {
    // console.log(`==================`);
    // console.log(``);
    // console.log(`===== tick#${counter} =====`);
    await counter;
  }
}

main();
