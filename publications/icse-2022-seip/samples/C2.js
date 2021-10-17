import { A, P, F, sleep } from '../../util/asyncUtil';

async function f(p) {
  await p;
}

A(
  F(1),
  () => {
    const p = P(F(2));
    const q1 = f(p);
    const q2 = f(p);
    return q2;
  }
);
