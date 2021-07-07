const ProducerTimes = 2;
const ProducerTimesVar = 1;

const ConsumerTimes = 2;
const ConsumerTimesVar = 1;

const N = 12;

const MaxItems = 5;
const buffer = new Array(MaxItems);
const reserved = new Array(MaxItems);

const seedrandom = require('seedrandom');
seedrandom('dbux', { global: true });

let nProducers = 0;
let nConsumers = 0;

let nItems = 0;

let consuming = 0;
let producing = 0;


let lastItem = 0;

export class ConsumerBase {
  constructor() {
    this.name = `[C${++nConsumers}]`;
    this.tickCount = 0;
  }

  get tag() {
    return `${this.name} [${this.tickCount}]`;
  }

  async run() {
    console.log(this.tag, 'consumer start');
    await this.repeatN(this.consumeOrIdle, N);
  }

  canConsume() {
    return nItems - consuming > 0;
  }

  startConsume = () => {
    ++consuming;

    const idx = reserved.findIndex((r, i) => !r && !!buffer[i]);
    reserved[idx] = true;
    console.log(this.tag, `consuming item[${idx}] ${buffer[idx]}...`);

    return idx;
  }

  finishConsume = (idx) => {
    const item = buffer[idx];
    buffer[idx] = 0;
    reserved[idx] = false;

    --nItems;
    --consuming;

    console.log(this.tag, `consumed item[${idx}] ${item}, ${nItems} (-${consuming}) left`);
  }

  doWork() {
    return this.sleep((ConsumerTimes - ConsumerTimesVar) + randomInt(2 * ConsumerTimesVar + 1));
  }
}


export class ProducerBase {
  constructor() {
    this.name = `[P${++nProducers}]`;
    this.tickCount = 0;
  }

  get tag() {
    return `${this.name} [${this.tickCount}]`;
  }

  async run() {
    console.log(this.tag, 'producer start');
    await this.repeatN(this.produceOrIdle, N);
  }

  canProduce() {
    return (producing + nItems) < MaxItems;
  }

  startProduce() {
    ++producing;
    console.log(this.tag, 'producing new item...');
  }

  finishProduce = () => {
    const item = ++lastItem;
    const idx = buffer.findIndex(x => !x);
    buffer[idx] = item;
    ++nItems;
    --producing;

    console.log(this.tag, `produced item[${idx}] ${item}, ${nItems} (-${consuming}) left`);
  }

  doWork() {
    return this.sleep((ProducerTimes - ProducerTimesVar) + randomInt(ProducerTimesVar * 2 + 1));
  }
}

/**
 * Randomly generate integer in {0, 1, ..., n - 1}
 */
function randomInt(n) {
  const x = Math.floor(Math.random() * n);
  return x;
}