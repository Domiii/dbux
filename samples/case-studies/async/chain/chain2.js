import { Abind, P, waitTicks } from '../../../util/asyncUtil';

function f(x) {
  return () => Abind(x,
    'A',
    () => P('AA', 'AB'),
    'B',
    () => P('BA', 'BB'),
    'C'
  )
};


A(
  f(1),
  f(2)
);