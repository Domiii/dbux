async function f(x) {
  console.log('f1', x);
  await 0;
  return g(x);
}

function g(x) {
  return Promise.resolve()
    .then(t.bind(null, 1, x))
    .then(t.bind(null, 2, x))
}

function t() { }

(async function main() {
  await f(1);
})();
