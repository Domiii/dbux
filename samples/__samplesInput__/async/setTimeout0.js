function f(x, n) {
  console.log('f', x);

  if (n) {
    setTimeout(f.bind(null, x, n-1), 100);
  }
}

// var b = f.bind;
// var c = b;
// var d = c;
// console.log(d, f.bind(null));

(async function main() {
  // await 0;
  // await 1;
  setTimeout(f.bind(null, 1, 3), 100);
  setTimeout(f.bind(null, 2, 0), 200);
})();

// function f1() {
//   console.log('done');
// }

// setTimeout(
//   () => { f1(1500); },
//   1500
// );