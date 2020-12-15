import { ConsumerBase, ProducerBase } from './producer_consumer_base';
import { sleepImmediate, repeatNAsync } from 'asyncUtil';

// async function forever(cb) {
//   while (true) {
//     await cb();
//   }
// }

// ###########################################################################
// Consumer
// ###########################################################################

class Consumer extends ConsumerBase {
  // forever = forever;
  // sleep = sleep;
  repeatN = repeatNAsync;
  // _sleep = sleepImmediate;
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

  // sleep = async (tick) => {
  //   // console.log(this.tag, `Consumer slept for ${tick} ticks`);
  //   await this._sleep(tick);
  //   this.tickCount += tick;
  // }
}


// ###########################################################################
// Producer
// ###########################################################################

class Producer extends ProducerBase {
  // forever = forever;
  // sleep = sleep;
  repeatN = repeatNAsync;
  // _sleep = sleepImmediate;
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

  // sleep = async (tick) => {
  //   // console.log(this.tag, `Producer slept for ${tick} ticks`);
  //   await this._sleep(tick);
  //   this.tickCount += tick;
  // }
}

// main

// start all producers + consumers
new Producer().run();

new Consumer().run();
