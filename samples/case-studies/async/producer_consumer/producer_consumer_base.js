import { randomInt } from 'asyncUtil';

// const seedrandom = require('seedrandom');
// seedrandom('dbux', { global: true });

// ###########################################################################
//  States & Constants
// ###########################################################################

const ProducerTime = 3;
const ProducerTimeVar = 5;
const ConsumerTime = 3;
const ConsumerTimeVar = 3;
const MaxItems = 5;
const buffer = [];
let nItems = 0;
let consuming = 0;
let producing = 0;
let lastItem = 0;

export const IdleTime = 1;
export const N = 3;

// ###########################################################################
//  Public
// ###########################################################################

export function hasSpace() {
  return (producing + nItems) < MaxItems;
}

export function hasItems() {
  return nItems - consuming > 0;
}

export function getProduceTime() {
  return Math.max(
    1,
    (ProducerTime - ProducerTimeVar) + randomInt(ProducerTimeVar * 2 + 1)
  );
}

export function startProduce() {
  ++producing;
  console.log(`producing item ${lastItem + producing}...`);
}

export function finishProduce() {
  const item = ++lastItem;
  buffer.push(item);
  ++nItems;
  --producing;

  console.log(`produced item ${item}, remaining: ${nItems}, producing: ${producing}, buffer: [${buffer}]`);
}

export function getConsumeTime() {
  return Math.max(
    1,
    (ConsumerTime - ConsumerTimeVar) + randomInt(2 * ConsumerTimeVar + 1)
  );
}

export function startConsume() {
  ++consuming;
  console.log(`consuming item ${buffer[consuming - 1]}...`);
}

export function finishConsume() {
  const item = buffer.shift();
  --nItems;
  --consuming;

  console.log(`consumed item ${item}, remaining: ${nItems}, consuming: ${consuming}, buffer: [${buffer}]`);
}
