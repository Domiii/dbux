/**
 * Findings: 
 * 
 * 1. Promise queue is a microtask queue - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises#timing
 * 2. Rejected promises can be handled asynchronously (not immediately)
 * 3. More info on JS queues: https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/
 * 
 */

async function countAwaitTicks(n = 6) {
  N = n;
  do {
    await new Promise(r => r());
    console.debug('await      tick', N - n + 1);
  } while (--n);
  console.debug('Tick counter ended.');
}
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function log(...args) { console.log(...args); }

async function f() {
  log('f', 1);
  const p = g();
  await h();
  console.time('time');
  // await sleep();
  for (let i = 0; i < 1e8; ++i) {
    await 0;
  }
  console.timeEnd('time');
  log('f', 2);
  await p;
  log('f', 3);
}

async function g() {
  log('g', 1);
  // await 0;
  log('g', 2);
  return new Promise((r, j) => j(new Error()));
}

async function h() {
  await 0;
}

async function main() {
  countAwaitTicks();

  log('main', 'start');
  try {
    await f();
    // await Promise.all([
    //   f(),
    //   g()
    // ]);
  } catch (err) { console.error('err', err); }

  log('main', 'end');
}
main();