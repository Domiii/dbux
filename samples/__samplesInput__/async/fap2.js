
// async function g(x) {
//   await x;
// }

async function f(x) {
  await x;
}

async function g(x) {
  await x;
}

async function h(x) {
  await x;
}

async function i(x) {
  await x;
}

async function main() {
  await f(1);
  await g(2);
  h(3);
  await i(4);
}

main();

/*
7 runs,
2 forks and 4 chains
*/