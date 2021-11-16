/* eslint-disable no-console */
const Promise = require('.');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function f() {
  // Plain text or HTML
  return Promise.resolve()
    .then(() => {
      console.log('A');
      return sleep(100);
    })
    .then(() => {
      console.log('B');
      return sleep(50);
    });
  // console.log('C');
}

Promise.resolve().then(f);
Promise.resolve().then(f);
Promise.resolve().then(f);
