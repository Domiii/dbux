import { IdleTime, N, startProduce, finishProduce, startConsume, finishConsume, hasSpace, hasItems, getProduceTime, getConsumeTime, } from './producer_consumer_base';
import { waitTicksCallback, repeatCallback } from 'asyncUtil';

/** ###########################################################################
 * Basic functions
 *  #########################################################################*/

function idle(next) {
  return waitTicksCallback(IdleTime, next);
}

function consume(next) {
  return waitTicksCallback(getConsumeTime(), function _finishConsume() {
    finishConsume();
    next();
  });
}

function produce(next) {
  return waitTicksCallback(getProduceTime(), function _finishProduce() {
    finishProduce();
    next();
  });
}

function producer(n) {
  const next = () => {
    // setImmediate(tryProduce);
    tryProduce();
  }
  function tryProduce() {
    if (n) {
      if (hasSpace()) {
        --n;
        startProduce();
        // produce(next);
        setImmediate(produce.bind(null, next));
      }
      else {
        // idle(next);
        setImmediate(idle.bind(null,next));
      }
    }
  }

  next();
}

function consumer(n) {
  const next = () => {
    // setImmediate(tryConsume);
    tryConsume();
  }
  function tryConsume() {
    if (n) {
      if (hasItems()) {
        --n;
        startConsume();
        // consume(next);
        setImmediate(consume.bind(null, next));
      }
      else {
        // idle(next);
        setImmediate(idle.bind(null, next));
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