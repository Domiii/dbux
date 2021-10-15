/**
 * 
 */
import { P } from '../../util/asyncUtil';

function f() { }
function g() { }
function h() { }

var p = P(f);

P(p,
  g,
  h
);

P(p,
  g,
  h
);