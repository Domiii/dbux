/**
 * @file 
 */

import { A, P, Abind, Pbind, sleep } from '../../util/asyncUtil';

const nodes = [
  'A',
  // [
  //   'BA',
  //   'BB'
  // ],
  () => Promise.any(
    ['r1', 'r2'].map(async reason => {
      await sleep(0);
      return Promise.reject(reason);
    })
      .concat(
        [1, 2, 3, 4].map(y => P(
          ...[1, 2].map(x =>
            () => {
              `C${x}${y}`
              return sleep((5 - y) * 100);
            }
          )
        ))
      )
  ),
  () => 'D',
  () => 'E'
];

Abind('A', ...nodes);
// Pbind('P', ...nodes);
