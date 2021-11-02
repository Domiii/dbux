/**
 * @file If a "middle promise" fails, remaining promises are on their own.
 */

import { P, Pbind, sleep } from '../../util/asyncUtil';

const nodes = [
  'A',
  // [
  //   'BA',
  //   'BB'
  // ],
  () => Promise.all(
    [1, 2, 3, 4, 5].map(y => P(
      ...[1, 2].map(x => {
        if (x === 2 && y === 3) {
          return () => { throw new Error('FAIL'); }
        }
        return async () => {
          await sleep();
          return P(`B${x}${y}`);
        };
      })
    ))
  )
    .catch(err => 'C'),
  'D',
  'E'
];

Pbind('A', ...nodes);
// Pbind('P', ...nodes);
