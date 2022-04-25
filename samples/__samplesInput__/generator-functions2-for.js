function* f(x) {
  yield x + 1;
  yield x + 2;
  yield x + 3;
}

(function main() {
  for (const x of f(10)) {
    console.log(x);
  }
})();