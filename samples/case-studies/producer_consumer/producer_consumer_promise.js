const MaxItems = 5;
const ProducerTime = 300;
const ProducerTimeVar = 100;

const ConsumerTime = 600;
const ConsumerTimeVar = 400;

const buffer = new Array(MaxItems);
const reserved = new Array(MaxItems);

let nItems = 0;

let consuming = 0;
let producing = 0;



function itemsLeft() {
  return nItems - consuming;
}

let lastItem = 0;


// ###########################################################################
// Consumer
// ###########################################################################

class Consumer {
  static nConsumers = 0;

  constructor() {
    this.name = `[C${++Consumer.nConsumers}]`;
  }

  canConsume() {
    return itemsLeft() > 0;
  }

  consume() {
    ++consuming;
    
    const idx = reserved.findIndex((r, i) => !r && !!buffer[i]);
    reserved[idx] = true;
    console.log(this.name, `consuming item[${idx}] ${buffer[idx]}...`);
    // console.log(this.name, `consuming item...`);
    sleep((ConsumerTime - ConsumerTimeVar) + 2 * ConsumerTimeVar * Math.random());
    
    const item = buffer[idx];
    buffer[idx] = 0;
    --nItems;
    reserved[idx] = false;

    --consuming;

    console.log(this.name, `consumed item[${idx}] ${item} (${itemsLeft()} left)`);
  }
  
  start() {
    console.log(this.name, 'consumer start');
    while (true) {
      if (this.canConsume()) {
        this.consume();
      }
      sleep();
    }
  }
}


// ###########################################################################
// Producer
// ###########################################################################

class Producer {
  static nProducers = 0;

  constructor() {
    this.name = `[P${++Producer.nProducers}]`;
  }

  canProduce() {
    return !producing && nItems < MaxItems;
  }

  produce() {
    ++producing;
    console.log(this.name, 'producing new item...');
    sleep((ProducerTime - ProducerTimeVar) + 2 * ProducerTimeVar * Math.random());

    const item = ++lastItem;
    const idx = buffer.findIndex(x => !x);
    buffer[idx] = item;
    ++nItems;

    --producing;
    console.log(this.name, `produced item[${idx}] ${item} (${itemsLeft()} left)`);
  }

  start() {
    console.log(this.name, 'producer start');
    while (true) {
      if (this.canProduce()) {
        this.produce();
      }
      sleep();
    }
  }
}

// main

// fork producer + consumer start functions
new Producer().start();
new Consumer().start();
new Consumer().start();


// utilities

function sleep(delay) {
  return new Promise(r => setTimeout(r, delay));
}