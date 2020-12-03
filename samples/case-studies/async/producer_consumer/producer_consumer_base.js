const MaxItems = 5;
const ProducerTime = 500;
const ProducerTimeVar = 100;

const ConsumerTime = 500;
const ConsumerTimeVar = 400;

const buffer = new Array(MaxItems);
const reserved = new Array(MaxItems);


let nProducers = 0;
let nConsumers = 0;

let nItems = 0;

let consuming = 0;
let producing = 0;


let lastItem = 0;


export class ConsumerBase {
  constructor() {
    this.name = `[C${++nConsumers}]`;
  }

  run() {
    console.log(this.name, 'consumer start');
    this.forever(this.consumeOrIdle);
  }

  canConsume() {
    return nItems - consuming > 0;
  }

  startConsume = () => {
    ++consuming;

    const idx = reserved.findIndex((r, i) => !r && !!buffer[i]);
    reserved[idx] = true;
    console.log(this.name, `consuming item[${idx}] ${buffer[idx]}...`);

    return idx;
  }

  finishConsume = (idx) => {
    const item = buffer[idx];
    buffer[idx] = 0;
    reserved[idx] = false;

    --nItems;
    --consuming;

    console.log(this.name, `consumed item[${idx}] ${item}, ${nItems} (-${consuming}) left`);
  }

  doWork(...args) {
    return this.sleep(...args, (ConsumerTime - ConsumerTimeVar) + 2 * ConsumerTimeVar * Math.random());
  }
}


export class ProducerBase {
  constructor() {
    this.name = `[P${++nProducers}]`;
  }

  run() {
    console.log(this.name, 'producer start');
    this.forever(this.produceOrIdle);
  }

  canProduce() {
    return (producing + nItems) < MaxItems;
  }

  startProduce() {
    ++producing;
    console.log(this.name, 'producing new item...');
  }

  finishProduce = () => {
    const item = ++lastItem;
    const idx = buffer.findIndex(x => !x);
    buffer[idx] = item;
    ++nItems;
    --producing;

    console.log(this.name, `produced item[${idx}] ${item}, ${nItems} (-${consuming}) left`);
  }

  doWork(...args) {
    return this.sleep(...args, (ProducerTime - ProducerTimeVar) + 2 * ProducerTimeVar * Math.random());
  }
}