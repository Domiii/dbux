import { ConsumerBase, ProducerBase } from './producer_consumer_base';
import { sleepImmediate, repeatNPromise } from 'asyncUtil';

/**
 * @see https://github.com/caolan/async/blob/master/lib/forever.js#L37
 */
// function foreverPromiseProducer(task) {
//   function next() {
//     return Promise.resolve(task()).
//       then(next);
//   }
//   return next();
// }

// function foreverPromiseConsumer(task) {
//   function next() {
//     return Promise.resolve(task()).
//       then(next);
//   }
//   return next();
// }

// ###########################################################################
// Consumer
// ###########################################################################

class Consumer extends ConsumerBase {
  // forever = foreverPromiseConsumer;
  // sleep = sleep;
  repeatN = repeatNPromise;
  // _sleep = sleepImmediate;
  sleep = sleepImmediate;

  consumeOrIdle = () => {
    if (this.canConsume()) {
      const idx = this.startConsume();

      return this.doWork().
        then(() => this.finishConsume(idx));
    }
    else {
      return this.sleep(2);
    }
  }

  // sleep = (tick) => {
  //   // console.log(this.tag, `Consumer slept for ${tick} ticks`);
  //   return this._sleep(tick).then(() => this.tickCount += tick);
  // }
}


// ###########################################################################
// Producer
// ###########################################################################

class Producer extends ProducerBase {
  // forever = foreverPromiseProducer;
  // sleep = sleep;
  repeatN = repeatNPromise;
  // _sleep = sleepImmediate;
  sleep = sleepImmediate;

  produceOrIdle = () => {
    if (this.canProduce()) {
      this.startProduce();

      return this.doWork().
        then(this.finishProduce);
    }
    else {
      return this.sleep(2);
    }
  }

  // sleep = (tick) => {
  //   // console.log(this.tag, `Producer slept for ${tick} ticks`);
  //   return this._sleep(tick).then(() => this.tickCount += tick);
  // }
}

// main

// start all producers + consumers
new Producer().run();

new Consumer().run();
