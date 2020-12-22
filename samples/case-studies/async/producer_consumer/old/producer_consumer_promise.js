import { ConsumerBase, ProducerBase } from './producer_consumer_base';
import { sleepImmediate, repeatNPromise } from 'asyncUtil';

// ###########################################################################
// Consumer
// ###########################################################################

class Consumer extends ConsumerBase {
  repeatN = repeatNPromise;
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
}

// ###########################################################################
// Producer
// ###########################################################################

class Producer extends ProducerBase {
  repeatN = repeatNPromise;
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
}

// main

// start all producers + consumers
new Producer().run();

new Consumer().run();
