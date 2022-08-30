import { IdleTime, N, startProduce, finishProduce, startConsume, finishConsume, hasSpace, hasItems, waitTicksCallback, schedule } from './producer_consumer_base';

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

function wait(queue, next) {
  queue.push(next);
}

/** ###########################################################################
 * Basic functions
 *  #########################################################################*/

function consume(next) {
  const [index, item, ticks] = startConsume();
  return waitTicksCallback(ticks, function _finishConsume() {
    finishConsume(index);
    notify(producerQueue);
    next();
  });
}

function produce(next) {
  const [index, item, ticks] = startProduce();
  return waitTicksCallback(ticks, function _finishProduce() {
    finishProduce(index);
    notify(consumerQueue);
    next();
  });
}

function producer(n) {
  const next = () => {
    schedule(tryProduce);
    // tryProduce();
  };
  function tryProduce() {
    if (n) {
      if (hasSpace()) {
        --n;
        produce(next);
      }
      else {
        wait(producerQueue, next);
      }
    }
  }

  next();
}

function consumer(n) {
  const next = () => {
    schedule(tryConsume);
    // tryConsume();
  };
  function tryConsume() {
    if (n) {
      if (hasItems()) {
        --n;
        consume(next);
      }
      else {
        wait(consumerQueue, next);
      }
    }
  }
  next();
}

/** ###########################################################################
 * Main
 *  #########################################################################*/

producer(2 * N);
consumer(N);
consumer(N);
consumer(N);
producer(N);