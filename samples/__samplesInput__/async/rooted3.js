/**
 * 
 */


(async function main() {
  var p = f(1);
  g(1, p);          // first time `p` is being awaited, chained to g(1) -> not chained to root: missing `await`
  await g(2, p);    // second time -> also not chained to root: `p` was already chained to g(1)
})();

async function f(x) {
  console.log('f1', x);
  await 0;
  console.log('f2', x);
  await 0;
  console.log('f3', x);
}


async function g(x, p) {
  console.log('g1', x);
  await p;
  console.log('g2', x);
}