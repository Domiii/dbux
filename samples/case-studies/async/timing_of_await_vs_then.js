// async function sleep() {
//   return new Promise(r => setImmediate(r));
// }

// async function f() { await sleep(); }
// async function g() { await sleep(); }
// async function h() { await sleep(); }

async function f(x) {
  console.log('f1', x);
  await g(x);
  console.log('f2', x);
}
async function g(x) {
  console.log('g1', x);
  await 0;
  console.log('g2', x);
}


(async function main() {
  console.log('main1');
  f(1);
  f(2);
  f(3);
  Promise.resolve().
    then(() => console.log(4)).
    then(() => console.log(44));
  Promise.resolve().
    then(() => console.log(5)).
    then(() => console.log(55));
  console.log('main2');
})();
