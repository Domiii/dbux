/**
 * @file Edge case of `getPreUpdateOfNestedPromise` in `UP`:
 * Since it is not unique, getting the "first" awaiting AE, can lead to confusion.
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
    return q2;
  },
  () => 'C'
);