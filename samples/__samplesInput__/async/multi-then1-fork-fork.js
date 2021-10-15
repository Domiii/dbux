/**
 * 
 */
import { P } from '../../util/asyncUtil';

function f() { }
function g() { }

var p = P();

P(p,
  f,
  g
);

P(p,
  f,
  g
);