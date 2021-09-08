import { randomInt } from 'asyncUtil';

// const seedrandom = require('seedrandom');
// seedrandom('dbux', { global: true });

// ###########################################################################
//  States & Constants
// ###########################################################################

const ProducerTime = 2;
const ProducerTimeVar = 1;
const ConsumerTime = 2;
const ConsumerTimeVar = 1;
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
  return (ProducerTime - ProducerTimeVar) + randomInt(ProducerTimeVar * 2 + 1)
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

  console.log(`produced item ${item}, ${nItems} (-${consuming}) left`);
}

export function getConsumeTime() {
  return (ConsumerTime - ConsumerTimeVar) + randomInt(2 * ConsumerTimeVar + 1)
}

export function startConsume() {
  ++consuming;
  console.log(`consuming item ${buffer[consuming - 1]}...`);
}

export function finishConsume() {
  const item = buffer.shift();
  --nItems;
  --consuming;

  console.log(`consumed item ${item}, ${nItems} (-${consuming}) left`);
}
