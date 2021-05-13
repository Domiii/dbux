setImmediate(() => {
  console.log('setImmediate');
});
countPromiseTicks();
countAwaitTicks();
countNextTick();


// (async function main() {
//   console.log(1);
//   await u();
//   console.log(2);
// })();


function countPromiseTicks(n = 3) {
  countWith('promise', (...args) => Promise.resolve().then(...args), n);
}

function countNextTick(n = 3) {
  countWith('nextTick', process.nextTick.bind(process), n);
}

async function countAwaitTicks(n = 3) {
  do {
    await new Promise(r => r());
    console.debug('await      tick', n);
  } while (--n);
}

function countWith(name, schedule, n) {
  if (!n) return;
  schedule(() => {
    console.debug(`${name.padEnd(10, ' ')} tick`, n);
    countWith(name, schedule, --n);
  })
}

console.log('eof');