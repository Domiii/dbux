async function main() {
  A;
  await start;
  B;
  await Promise.resolve()
    .then(function f() {
      C;
    })
    .then(function g() {
      D;
      return h();
    });
  await 2;
}


let fA, fB, fC, fD, gA, gB;
let start;
let A, B, C, D, E;
function h() {
  i();
}
function i() {
  return j();
}
function j() {
  return 'k';
}
main();

// TODO: produce a version with forks for more tests in different environments.