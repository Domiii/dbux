import { hasSpace, reserveSpace, produce, append, hasItems, reserveItem, consume, remove, idle, N } from './producer_consumer_base';

async function producer() {
  let n = N;
  while (--n) {
    if (hasSpace()) {
      reserveSpace();
      await produce();
      append();
    }
    else {
      await idle();
    }
  }
}

async function consumer() {
  let n = N;
  while (--n) {
    if (hasItems()) {
      reserveItem();
      await consume();
      remove();
    }
    else {
      await idle();
    }
  }
}

// main: start all producers + consumers
producer();
consumer();