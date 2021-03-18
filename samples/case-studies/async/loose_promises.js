import { f, g, f1, f2, f3, g1, g2 } from './_common';

/**
 * loose01, loose02 and loose03 all have the same scheduling semantics.
 * However, loose01 has a different return value.
 */
async function loose01() {
  const p1 = f(1);
  await p1;               // C(1,2)
}

async function loose02() {
  const p1 = f(1);
  return p1;              // C(1,2)
}

async function loose03() {
  const p1 = f(1);
  return await p1;        // C(1,2)
}

/**
 * Functionally equivalent to loose12.
 */
async function loose11() {
  const p1 = f(1);
  const p2 = f(2);   // F(1, 3)

  return Promise.all([p1, p2]); // C(1, 2) + J(2, 3) — Following events implicitly wait for 2 and 3
}

async function loose12() {
  const p1 = f(1);
  const p2 = f(2);    // F(1, 3)

  await p1;           // C(1, 2)
  return p2;          // J(2, 3)
}

function loose4() {
  return f(1).
    then(() => {
      new Promise(g1).
        then(() => {
          f(2).
            then(f3)
        });
    });
}