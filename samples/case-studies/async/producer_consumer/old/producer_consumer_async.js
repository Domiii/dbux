import { ConsumerBase, ProducerBase } from './producer_consumer_base';
import { sleepImmediate, repeatNAsync } from 'asyncUtil';

// ###########################################################################
// Consumer
// ###########################################################################

class Consumer extends ConsumerBase {
  repeatN = repeatNAsync;
  sleep = sleepImmediate;

  consumeOrIdle = async () => {
    if (this.canConsume()) {
      const idx = this.startConsume();

      await this.doWork();

      this.finishConsume(idx);
    }
    else {
      await this.sleep(2);
    }
  }
}

// ###########################################################################
// Producer
// ###########################################################################

class Producer extends ProducerBase {
  repeatN = repeatNAsync;
  sleep = sleepImmediate;

  produceOrIdle = async () => {
    if (this.canProduce()) {
      this.startProduce();

      await this.doWork();

      this.finishProduce();
    }
    else {
      await this.sleep(2);
    }
  }
}

// main

// start all producers + consumers
new Producer().run();

new Consumer().run();
