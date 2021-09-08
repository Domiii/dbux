/**
 * @file Test for `NestedPromiseCollection`.
 * NOTE: inner-most nested update does not have a Post* event?
 */

import { A, P, waitTicks } from '../../../util/asyncUtil';

P(
  'A',
  [
    'AA',
    () => P('AAA'),
    'AB'
  ],
  'B'
);
