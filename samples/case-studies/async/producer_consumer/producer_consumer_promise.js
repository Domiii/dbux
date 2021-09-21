import { IdleTime, N, startProduce, finishProduce, startConsume, finishConsume, hasSpace, hasItems, getProduceTime, getConsumeTime, } from './producer_consumer_base';
import { waitTicksPromise, repeatPromise, pt } from 'asyncUtil';

/** ###########################################################################
 * Basic functions
 *  #########################################################################*/

function idle() {
  // return sleep() // for debugging purposes
  //   .then(() =>
  //     waitTicksPromise(IdleTime)
  //   );
  return waitTicksPromise(IdleTime).then(function _doneIdle() { });
}

function consume() {
  return waitTicksPromise(getConsumeTime())
    .then(finishConsume);
}

function produce() {
  return waitTicksPromise(getProduceTime())
    .then(finishProduce);
}

function producer(n) {
  return repeatPromise(n,
    function tryProduce() {
      if (hasSpace()) {
        startProduce();
        return pt(produce);
      }
      else {
        // return idle();
        return pt(idle);
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
        startConsume();
        return pt(consume);
      }
      else {
        // console.log('cons idle', n);
        // return idle();
        return pt(idle);
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