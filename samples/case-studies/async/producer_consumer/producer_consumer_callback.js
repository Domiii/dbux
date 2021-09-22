import { IdleTime, N, startProduce, finishProduce, startConsume, finishConsume, hasSpace, hasItems, getProduceTime, getConsumeTime, } from './producer_consumer_base';
import { waitTicksPromise, repeatPromise/* , sleep */ } from 'asyncUtil';

/** ###########################################################################
 * Basic functions
 *  #########################################################################*/

function idle() {
  // return sleep() // for debugging purposes
  //   .then(() =>
  //     waitTicksPromise(IdleTime)
  //   );
  return waitTicksPromise(IdleTime);
}

function consume() {
  startConsume();
  return waitTicksPromise(getConsumeTime())
    .then(finishConsume);
}

function produce() {
  startProduce();
  return waitTicksPromise(getProduceTime())
    .then(finishProduce);
}

function producer(n) {
  return repeatPromise(n, function producerTick() {
    if (hasSpace()) {
      return produce();
    }
    else {
      return idle();
    }
  });
}

function consumer(n) {
  return repeatPromise(
    () => !!n,
    function consumerTick() {
      if (hasItems()) {
        --n;
        console.log('cons', n);
        return consume();
      }
      else {
        console.log('cons idle', n);
        return idle();
      }
    }
  );
}

/** ###########################################################################
 * Main
 *  #########################################################################*/

producer(2 * N);
consumer(N);
consumer(N);
consumer(N);
producer(N);