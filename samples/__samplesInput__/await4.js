async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log(1);
  f('arg f')
  console.log(3);
  await g('arg g');
  console.log(7);
}

async function f(s) {
  console.log(2);
  await sleep(300);
  console.log(5);
}

async function g(s) {
  console.log(4);
  await sleep(600);
  console.log(6);
}

main();

async function af44() {
  const a = await f();
  const b = await f(1);
}

async function f(x) {
  return console.log(x), 4;
}

af44();
