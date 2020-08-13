const a = [1, 2];

// console.log(process.argv.join(' # '));

f(1, a);

function f(...args) {
  console.log('f', ...args);
}

function g(...args) {
  console.log('g', ...args);
  return 2;
}
