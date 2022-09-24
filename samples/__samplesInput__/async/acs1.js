async function f() {
  fA;
  await f2();
  fB;
}
async function main() {
  A;
  await start;
  B;
  await Promise.resolve()
    .then(async function g() {
      C;
      await f();
      D;
    })
    .then(function h() {
      E;
    });
  await 2;
}


let fA, fB, fC, fD, gA, gB;
let start;
let A, B, C, D, E;
function f2() { }
main();

// TODO: produce a version with forks for more tests in different environments.