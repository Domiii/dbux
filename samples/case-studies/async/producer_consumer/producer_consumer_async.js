import { hasSpace, reserveSpace, produce, append, hasItems, reserveItem, consume, remove, idle, N } from 'producer_consumer_base';

async function producer(n) {
  while (n--) {
    if (hasSpace()) {
      await produce();
    }
    else {
      await idle();
    }
  }
}

async function consumer(n) {
  while (n--) {
    if (hasItems()) {
      await consume();
    }
    else {
      await idle();
    }
  }
}

// main: start all producers + consumers
producer(N);
producer(N);
consumer(N);
consumer(N);