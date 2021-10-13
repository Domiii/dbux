/**
 * @file Edge case of `getFirstUpdateOfNestedPromise` in `UP`.
 */

import { A, P } from '../../../util/asyncUtil';

async function f(p) {
  await p;
}

A(
  () => 'A',
  () => {
    const p = P(() => 'B1');
    const q1 = f(p);
    const q2 = f(p);
    return q1;
  },
  () => 'C'
);