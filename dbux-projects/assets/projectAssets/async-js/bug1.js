/**
 * @file
 * @see https://github.com/caolan/async/issues/1729
 */

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
const { queue } = require('./lib');

function start() { }

async function main() {
  await start();
  const q = queue(async function processTask(task) {
    await sleep(10);
    console.log("task done");
  });

  q.push([]);       // NOTE: bug is caused by this line
  q.push([1, 2]);

  await q.drain();
  console.log("all tasks completed");
}

main();
