function f() {
  setTimeout(g, 
    300);
  console.log('f');
}

function g() {
  console.log('g');
}

function main() {
  setTimeout(f, 300);
}

main();

// function f1() {
//   console.log('done');
// }

// setTimeout(
//   () => { f1(1500); },
//   1500
// );