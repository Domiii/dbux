const countAwaitTicks = require('../asyncTicks').countAwaitTicks;

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