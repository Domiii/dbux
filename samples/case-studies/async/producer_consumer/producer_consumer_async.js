import { ConsumerBase, ProducerBase } from './producer_consumer_base';
import { sleep } from '../asyncUtil';

async function forever(cb) {
  while (true) {
    await cb();
  }
}

// ###########################################################################
// Consumer
// ###########################################################################

class Consumer extends ConsumerBase {
  forever = forever;
  sleep = sleep;

  consumeOrIdle = async () => {
    if (this.canConsume()) {
      const idx = this.startConsume();

      await this.doWork();

      this.finishConsume(idx);
    }
    else {
      await sleep();
    }
  }
}


// ###########################################################################
// Producer
// ###########################################################################

class Producer extends ProducerBase {
  forever = forever;
  sleep = sleep;

  produceOrIdle = async () => {
    if (this.canProduce()) {
      this.startProduce();

      await this.doWork();

      this.finishProduce();
    }
    else {
      await sleep();
    }
  }
}

// main

// start all producers + consumers
new Producer().run();
new Producer().run();

new Consumer().run();
new Consumer().run();
