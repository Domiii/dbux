/**
 * Three FORKs: one FORK per `g`.
 * * f CHAINs into g1
 * * g2 and g3 SYNC against f
 */

(async function main() {
  const p = f();
  // await p;
  g(1, p);
  g(2, p);
  g(3, p);
})();

async function f() {
  console.log('fA');
  await 0;
  console.log('fB');
}

async function g(x, p) {
  console.log('gA', x);
  await p;
  console.log('gB', x);
}