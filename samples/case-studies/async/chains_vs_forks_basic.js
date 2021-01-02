import { f, g, f1, f2, f3, g1, g2 } from './_common';

async function chain1() {
  await f(1);
  await f(2);
}

function chain2() {
  return f(1).
    then(f2);
}

function chain3() {
  return f(1).
    then(() => new Promise(g1)).
    then(f2);
}

function chain4() {
  return f(1).
    then(() =>
      new Promise(g1).
        then(() => 
          f(2).
            then(f3)
        )
    ).
    then(f3);
}

function chain5() {
  return f(1).
    then(() => {
      const p = new Promise(g1);
      return p.
        then(() => 
          f(2).
            then(f3)
        )
    });
}

async function fork1() {
  f(1);                       // F(1, 2)
  f(2);                       // F(1, 3)
}

async function forkAndChain1() {
  f(1).                       // F(1, 2)
    then(f2);                 // C(2, 3)
}