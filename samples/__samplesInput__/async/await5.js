async function f(x) {
  console.log('f1', x);
  return g(x);
}

async function g(x) {
  console.log('g1', x);
  await 0;
  console.log('g2', x);
  await 1;
  console.log('g3', x);
}

(async function main() {
  await f(1);
})();
