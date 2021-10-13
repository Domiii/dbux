/**
 * @file Base case: chain against all promises.
 */

import { A, P, Abind, Pbind } from '../../util/asyncUtil';

const nodes = [
  'A',
  // [
  //   'BA',
  //   'BB'
  // ],
  () => Promise.all(
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
