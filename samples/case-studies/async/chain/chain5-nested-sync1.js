/**
 * @file Sync and chain coming from nested promise
 */

import { P, waitTicks } from '../../../util/asyncUtil';


var q;
var p1 = P(1, 2, 3, 4, 5, 6, () => q);

P(
  'A',
  [
    'AA',
    () => {
      q = P('q');
      return P(p1);
    },
    'AB'
  ],
  'B'
);
