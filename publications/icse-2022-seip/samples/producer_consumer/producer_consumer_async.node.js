"use strict";

var _producer_consumer_base = require("producer_consumer_base");

async function producer(n) {
  while (n--) {
    if ((0, _producer_consumer_base.hasSpace)()) {
      await (0, _producer_consumer_base.produce)();
    } else {
      await (0, _producer_consumer_base.idle)();
    }
  }
}

async function consumer(n) {
  while (n--) {
    if ((0, _producer_consumer_base.hasItems)()) {
      await (0, _producer_consumer_base.consume)();
    } else {
      await (0, _producer_consumer_base.idle)();
    }
  }
} // main: start all producers + consumers


producer(_producer_consumer_base.N);
producer(_producer_consumer_base.N);
consumer(_producer_consumer_base.N);
consumer(_producer_consumer_base.N);
