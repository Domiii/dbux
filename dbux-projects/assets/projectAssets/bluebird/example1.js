/* eslint-disable no-console */
const Promise = require('.');

function sleep(ms) {
  return new Promise(r => setTimeout(() => r(), ms));
}

function f() {
  return Promise.resolve()
    .then(() => {
      console.log('A');
      return sleep(100);
    })
    .then(() => {
      console.log('B');
      return sleep(100);
    });
}

f();
f();
f();
