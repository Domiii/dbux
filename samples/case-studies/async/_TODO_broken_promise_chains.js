// edge-case promise nesting
// -> leads to inner-most await not handled correctly



async function g() {
  await 0;
}

let p;

async function f() {
  await (p = g());
}

async function main() {
  f();
  await p;
}