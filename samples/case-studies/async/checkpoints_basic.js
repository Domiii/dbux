import { f, g, f1, f2, f3, g1, g2 } from './_common';


async function check2() {
  const p = f(1);   // F(1, 2)
  await f(2);       // C(1, 3)

  return p;         // J(2, 3) — Following events implicitly wait for 2 and 3
}