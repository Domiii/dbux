/**
 * @file 
 */

import { P } from '../../../util/asyncUtil';


function f() {
  return P('f1', 'f2');
}

function g() {
  return f().then(() => 'g2');
}

function h() {
  return g().then(() => 'h2');
}

P(
  'A',
  h,
  'B'
);
