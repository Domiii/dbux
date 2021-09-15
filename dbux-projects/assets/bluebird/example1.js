/* eslint-disable no-console */
const Promise = require('.');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  // Plain text or HTML
  try {
    await Promise.resolve()
      .then(() => {
        console.log('A');
        return sleep(100);
      })
      .then(() => {
        console.log('B');
        return sleep(50);
      });
    console.log('C');
  }
  catch (err) {
    console.error("FAIL", err);
  }
}

main();