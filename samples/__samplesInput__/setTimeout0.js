function f(x) {
  console.log('f', x);
}

(async function main() {
  await 0;
  await 1;
  setTimeout(f.bind(null, 1), 100);
  setTimeout(f.bind(null, 2), 200);
})();

// function f1() {
//   console.log('done');
// }

// setTimeout(
//   () => { f1(1500); },
//   1500
// );