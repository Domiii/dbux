import seedrandom from 'seedrandom';
import { sleepImmediate, randomInt } from 'asyncUtil';
seedrandom('dbux', { global: true });

// ###########################################################################
//  States & Constants
// ###########################################################################

const N = 20;

const ProducerTime = 2;
const ProducerTimeVar = 1;
const ConsumerTime = 2;
const ConsumerTimeVar = 1;
const IdleTime = 1;

const MaxItems = 5;
const buffer = [];

let nItems = 0;

let consuming = 0;
let producing = 0;

let lastItem = 0;

export { N };

// ###########################################################################
//  Common
// ###########################################################################

export function idle() {
  return sleepImmediate(IdleTime);
}

// ###########################################################################
//  Producer
// ###########################################################################

export function hasSpace() {
  return (producing + nItems) < MaxItems;
}

export function reserveSpace() {
  ++producing;
  console.log(`producing item ${lastItem + producing}...`);
}

export function produce() {
  return sleepImmediate((ProducerTime - ProducerTimeVar) + randomInt(ProducerTimeVar * 2 + 1));
}

export function append() {
  const item = ++lastItem;
  buffer.push(item);
  ++nItems;
  --producing;

  console.log(`produced item ${item}, ${nItems} (-${consuming}) left`);
}

// ###########################################################################
//  Consumer
// ###########################################################################

export function hasItems() {
  return nItems - consuming > 0;
}

export function reserveItem() {
  ++consuming;
  console.log(`consuming item ${buffer[consuming - 1]}...`);
}

export function consume() {
  return sleepImmediate((ConsumerTime - ConsumerTimeVar) + randomInt(2 * ConsumerTimeVar + 1));
}

export function remove() {
  const item = buffer.shift();
  --nItems;
  --consuming;

  console.log(`consumed item ${item}, ${nItems} (-${consuming}) left`);
}