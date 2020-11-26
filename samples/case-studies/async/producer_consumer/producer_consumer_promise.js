import { ConsumerBase, ProducerBase } from './producer_consumer_base';
import { sleep } from '../asyncUtil';

/**
 * @see https://github.com/caolan/async/blob/master/lib/forever.js#L37
 */
function foreverPromise(task) {
  function next() {
    return Promise.resolve(task()).
      then(next);
  }
  return next();
}


// ###########################################################################
// Consumer
// ###########################################################################

class Consumer extends ConsumerBase {
  forever = foreverPromise;
  sleep = sleep;

  consumeOrIdle = () => {
    if (this.canConsume()) {
      const idx = this.startConsume();

      return this.doWork().
        then(() => this.finishConsume(idx));
    }
    else {
      return sleep();
    }
  }
}


// ###########################################################################
// Producer
// ###########################################################################

class Producer extends ProducerBase {
  forever = foreverPromise;
  sleep = sleep;

  produceOrIdle = () => {
    if (this.canProduce()) {
      this.startProduce();

      return this.doWork().
        then(this.finishProduce);
    }
    else {
      return sleep();
    }
  }
}

// main

// start all producers + consumers
new Producer().run();
new Producer().run();

new Consumer().run();
new Consumer().run();
