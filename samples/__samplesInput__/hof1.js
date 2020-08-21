function f(a) {
  return a.reduce((acc, x) => acc + x);
}

(function main() {
  const x = 3;
  console.log(f([x * 2, x * 4, x * 7]) - f([x, x+1, x+12]));
})();