import { Abind, P, waitTicks } from '../../../util/asyncUtil';

function f(x) {
  Abind(x,
    'A',
    () => P('AA', 'AB'),
    'B',
    () => P('BA', 'BB'),
    'C'
  )
}

f(1);
// f(2);