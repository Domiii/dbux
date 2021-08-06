/**
 * This logic is used in retry-as-promised
 * @see https://github.com/mickhansen/retry-as-promised/blob/master/index.js#L60
 */


async function f() {
  console.log('f1');
  await 0;
  console.log('f2');
  const a = await pp();
  await 1;
  console.log('f3', a, a === 123);
}

function pp() {
  return new Promise(r => {
    var p = g();
    var q = Promise.resolve(p);
    // NOTE: 
    //   Since `global.Promise` is now `PatchedPromise`,
    //   and an async function's return value is a native Promise,
    //   `Promise.resolve` creates a new promise.
    // console.log('p === q', p === q, p, q);
    q.then(() => (console.log('resolve'), r()))//.then(h);
  });
}

function g() {
  // await 0;
  return 123;
  // return Promise.resolve().then(() => 123);
}

async function h() {
  await 0;
  await 1;
}

f();
