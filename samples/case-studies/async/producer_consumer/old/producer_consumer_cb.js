import { ConsumerBase, ProducerBase } from './producer_consumer_base';

const sleep = setTimeout;

/**
 * 
 */
function foreverCb(task) {
  function next() {
    return task(next);
  }
  return next();
}

// ###########################################################################
// Consumer
// ###########################################################################

class Consumer extends ConsumerBase {
  forever = foreverCb;
  sleep = sleep;

  consumeOrIdle = (next) => {
    if (this.canConsume()) {
      const idx = this.startConsume();

      this.doWork(() => {
        this.finishConsume(idx);
        next();
      });
    }
    else {
      sleep(next, 300);
    }
  }
}


// ###########################################################################
// Producer
// ###########################################################################

class Producer extends ProducerBase {
  forever = foreverCb;
  sleep = sleep;

  produceOrIdle = (next) => {
    if (this.canProduce()) {
      this.startProduce();

      this.doWork(() => {
        this.finishProduce();
        next();
      });
    }
    else {
      sleep(next, 300);
    }
  }
}

// main

// start all producers + consumers
new Producer().run();

new Consumer().run();
