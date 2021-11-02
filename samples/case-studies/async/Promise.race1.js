/**
 * @file 
 */

import { A, P, Abind, Pbind } from '../../util/asyncUtil';

const nodes = [
  'A',
  // [
  //   'BA',
  //   'BB'
  // ],
  () => Promise.race(
    [1, 2, 3, 4].map(y => P(
      ...[1, 2].map(x =>
        `C${x}${y}`
      )
    ))
  ),
  'D',
  'E'
];

Abind('A', ...nodes);
// Pbind('P', ...nodes);
