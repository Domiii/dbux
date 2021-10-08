import noop from 'lodash/noop';

/** ###########################################################################
 * util (copied from asyncUtil)
 * ##########################################################################*/

export function randomInt(n) {
  return Math.floor(Math.random() * n);
}

// ###########################################################################
//  States & Constants
// ###########################################################################

// config
// export const IdleTime = 1;
export const N = 3;
const ProducerTime = 3;
const ProducerTimeVar = 5;
const ConsumerTime = 3;
const ConsumerTimeVar = 5;
const MaxItems = 2;

// global queue
const buffer = [];
let nItems = 0;
let consuming = 0;
let producing = 0;
let lastItem = 0;


// ###########################################################################
//  Public
// ###########################################################################

function useItem(item) {
  // noop
  noop(item);
}

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
  const newItem = lastItem + producing;
  console.log(`producing item ${newItem}...`);
  useItem(newItem);
}

export function finishProduce() {
  if (buffer.length >= MaxItems) {
    throw new Error(`tried to produce when full`);
  }

  const item = ++lastItem;
  buffer.push(item);
  ++nItems;
  --producing;

  console.log(`produced item ${item}, remaining: ${nItems}, producing: ${producing}, buffer: [${buffer}]`);
  useItem(item);
}

export function getConsumeTime() {
  return Math.max(
    1,
    (ConsumerTime - ConsumerTimeVar) + randomInt(2 * ConsumerTimeVar + 1)
  );
}

export function startConsume() {
  if (buffer.length < 1) {
    throw new Error(`tried to consume when empty`);
  }
  ++consuming;
  const item = buffer[consuming - 1];
  useItem(item);
  console.log(`consuming item ${item}...`);
}

export function finishConsume() {
  const item = buffer.shift();
  --nItems;
  --consuming;

  console.log(`consumed item ${item}, remaining: ${nItems}, consuming: ${consuming}, buffer: [${buffer}]`);
  useItem(item);
}
