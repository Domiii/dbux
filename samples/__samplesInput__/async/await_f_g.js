const sleep = require('sleep.js');

async function f() {
  await sleep(20);
}

async function main() {
  f();
}

main();