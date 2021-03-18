function main() {
  f();
}

function f() {
  console.log('f');
  g();
}

function g() {
  console.log('g');
}

setTimeout(main, 1000);
setTimeout(main, 2000);

// function f1() {
//   console.log('done');
// }

// setTimeout(
//   () => { f1(1500); },
//   1500
// );