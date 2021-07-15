const N = 3;
const ProducerTime = 2;
const ProducerTimeVar = 1;
const buffer = [];
let nItems = 0;
let consuming = 0;
let producing = 0;
let lastItem = 0;

exports.sleepN = async function sleepN(times) {
  while (--times >= 0) {
    await 0;
  }
}

function randomInt(n) {
  return Math.floor(Math.random() * n);
}

async function produce() {
  ++producing;
  console.log(`producing item ${lastItem + producing}...`);

  await sleepN((ProducerTime - ProducerTimeVar) + randomInt(ProducerTimeVar * 2 + 1));

  const item = ++lastItem;
  buffer.push(item);
  ++nItems;
  --producing;

  console.log(`produced item ${item}, ${nItems} (-${consuming}) left`);
}

(async function main() {
  await produce();
})();