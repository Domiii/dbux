/** ########################################
 * main
 *  ######################################*/

 const delayFunctions = {
  // 1 tick
  returnZero() {
    return 0;
  },
  // 1 tick
  returnZeroWithLog() {
    log('Thread A', 1);
    return 0;
  },
  // 3 ticks
  returnPromise() {
    log('Thread A', `Into delay`);
    return Promise.resolve();
  },
  // 3 ticks
  returnPromiseWith1Then() {
    log('Thread A', `Into delay`);
    return Promise.resolve()
      .then(() => { log('Thread A', `wait#1`) });
  },
  // 4 ticks
  returnPromiseWith2Then() {
    log('Thread A', `Into delay`);
    return Promise.resolve()
      .then(() => { log('Thread A', `wait#1`) })
      .then(() => { log('Thread A', `wait#2`) });
  }
}

const pA = Promise.resolve()
  .then(() => log('Thread A', 1))
  // .then(delayFunctions.returnPromise)
  .then(delayFunctions.returnPromiseWith1Then)
  // .then(delayFunctions.returnPromiseWith2Then)
  .then(() => log('Thread A', 2))
  .then(() => log('Thread A', 3))
  .then(() => log('Thread A', 4))
  .then(() => log('Thread A', 5))
  .then(() => log('Thread A', 6))
  .then(() => log('Thread A', 7));
const pB = Promise.resolve()
  .then(() => log('Thread B', 1))
  .then(() => log('Thread B', 2))
  .then(() => log('Thread B', 3))
  .then(() => log('Thread B', 4))
  .then(() => log('Thread B', 5))
  .then(() => log('Thread B', 6))
  .then(() => log('Thread B', 7));

/** ########################################
 * measuring util
 *  ######################################*/

let tickCount = 0;
let running = true;
const res = [];

async function countAwaitTicks() {
  while (running) {
    log('Tick', `tick#${++tickCount} start`);
    await 0;
  }
}
countAwaitTicks();

function log(col, v) {
  const obj = [];
  obj[col] = v;
  res.push(obj);
}

Promise.all([pA, pB]).then(() => (console.table(res), running = false));
