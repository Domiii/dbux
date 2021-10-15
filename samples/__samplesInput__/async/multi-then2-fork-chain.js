/**
 * 
 */
import { P } from '../../util/asyncUtil';

function f() { }
function g() { }
function h() { }

P(
  f,
  () => {
    var p = P();

    var q1 = P(p,
      g,
      h
    );

    var q2 = P(p,
      g,
      h
    );


    return q2;
  }
);