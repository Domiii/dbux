import { IdleTime, N, startProduce, finishProduce, startConsume, finishConsume, hasSpace, hasItems, getProduceTime, getConsumeTime, } from './producer_consumer_base';
import { waitTicksAsync, repeatAsync, sleep } from 'asyncUtil';

/** ###########################################################################
 * Basic functions
 *  #########################################################################*/

async function idle() {
  await waitTicksAsync(IdleTime);
}

async function produce() {
  startProduce();
  await waitTicksAsync(getProduceTime());
  finishProduce();
}

async function consume() {
  startConsume();
  await waitTicksAsync(getConsumeTime());
  finishConsume();
}

async function producer(n) {
  await repeatAsync(n,
    async function tryProduce() {
      if (hasSpace()) {
        await produce();
      }
      else {
        await idle();
      }
    }
  );
}

async function consumer(n) {
  await repeatAsync(
    () => !!n,
    async function tryConsume() {
      // await sleep();
      if (hasItems()) {
        --n;
        // console.log('cons', n);
        await consume();
      }
      else {
        await idle();
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