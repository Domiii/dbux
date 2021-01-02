import { f, g, f1, f2, f3, g1, g2 } from './_common';

/**
 * Functionally equivalent to forkAndChain3
 */
async function forkAndChain4() {
  const p1 = f(1);   // F(1, 2)
  const p2 = f(2);   // F(1, 3)

  return Promise.all(p1, p2);  // J(2, 3) — Following events implicitly wait for 2 and 3
}

function forkAndChain5() {
  return f(1).
    then(() => {
      new Promise(g1).
        then(() => {
          f(2).
            then(f3)
        });
    });
}