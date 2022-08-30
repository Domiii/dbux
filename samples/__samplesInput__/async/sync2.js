/**
 * Three FORKs: one FORK per `g`.
 * * f CHAINs into g1
 * * g2 and g3 SYNC against f
 */

async function main() {
  await start();
  const p = f();
  await 0;
  g(p);
  g(p);
  g(null);
};

async function f() {
  await 0;
  await 1;
  await 2;
}

async function g(p) {
  if (p) {
    await p;
  }
  await 1;
}

function start() {
  return Promise.resolve();
}

main();