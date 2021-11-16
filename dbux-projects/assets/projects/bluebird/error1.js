/* eslint-disable no-console */
const Promise = require('./src/bluebird');

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
        throw new Error(`B failed`);
      })
      .catch((err) => {
        throw new Error(`caught error: "${err.message}"`);
      });
    console.log('C');
  }
  catch (err) {
    console.error("FAIL", err);
  }
}

main();