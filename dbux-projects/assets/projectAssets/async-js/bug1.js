/**
 * @file
 * @see https://github.com/caolan/async/issues/1729
 */

const { default: sleep } = require('@dbux/common/src/util/sleep');
const { queue } = require('./lib');

async function main() {
  await start();
  const q = queue(async (task) => {
    await sleep(1000);
    console.log("task done");
  });

  //Comment the empty array push line below
  // and see the issue go away
  q.push([]);
  q.push([1, 2]);

  await q.drain();
  console.log("all tasks completed");
}

main();
