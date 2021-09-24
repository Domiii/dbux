// import { A, Abind, Pbind } from '../../../util/asyncUtil';

function g(x) {
  return async () => {
    console.log('g', x, 1);
    await 2;
    console.log('g', x, 2);
    await 3;
    console.log('g', x, 3);
  };
}


async function f() {
  console.log('f', 0);
  await 0;
  const p = Promise.resolve();
  p.then(g(1));
  p.then(g(2));

  // await Promise.all([g(1)(), g(2)()]);

  await p;
}

f();