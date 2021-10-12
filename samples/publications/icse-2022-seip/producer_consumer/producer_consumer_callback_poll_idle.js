import { N, startProduce, finishProduce, startConsume, finishConsume, hasSpace, hasItems, getProduceTime, getConsumeTime, } from './producer_consumer_base';
import { schedule, waitTicksCallback } from '../../../util/asyncUtil';

const IdleTime = 3;

/** ###########################################################################
 * Basic functions
 *  #########################################################################*/

function idle(next) {
  return waitTicksCallback(IdleTime, next);
}

function consume(next) {
  const [index, item, ticks] = startConsume();
  return waitTicksCallback(ticks, function _finishConsume() {
    finishConsume(index);
    next();
  });
}

function produce(next) {
  const [index, item, ticks] = startProduce();
  return waitTicksCallback(ticks, function _finishProduce() {
    finishProduce(index);
    next();
  });
}

function producer(n) {
  const next = () => {
    schedule(tryProduce);
    // tryProduce();
  }
  function tryProduce() {
    if (n) {
      if (hasSpace()) {
        --n;
        produce(next);
      }
      else {
        idle(next);
      }
    }
  }

  next();
}

function consumer(n) {
  const next = () => {
    schedule(tryConsume);
    // tryConsume();
  }
  function tryConsume() {
    if (n) {
      if (hasItems()) {
        --n;
        consume(next);
      }
      else {
        idle(next);
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