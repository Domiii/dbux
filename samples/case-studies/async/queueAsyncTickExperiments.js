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
  await g();
  log('f', 2);
  await 0;
  log('f', 3);
}

async function g() {
  log('g', 1);
  await (hp = h());
  log('g', 2);
  await 0;
  log('g', 3);

}

async function h() {
  log('h', 1);
  await 0;
  log('h', 2);
}

async function main() {
  countAwaitTicks();

  log('main', 'start');
  try { 
    f();
    // await Promise.all([
    //   f(),
    //   g()
    // ]);
  } catch (err) { console.error('err', err); }

  log('main', 'end');
}
main();