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
  () => Promise.all(
    [1, 2, 3, 4].map(y => P(
      ...[1, 2].map(x =>
        () => {
          console.log(`C${x}${y}`);
          return sleep((y) * 100);
        }
      )
    ))
  ),
  () => Promise.race(
    [1, 2, 3, 4].map(y => P(
      ...[1, 2].map(x =>
        () => {
          console.log(`C${x}${y}`);
          return sleep((5 - y) * 100);
        }
      )
    ))
  ),
  () => 'D',
  () => 'E'
];

Abind('A', ...nodes);
// Pbind('P', ...nodes);
