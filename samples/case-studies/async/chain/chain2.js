import { Abind, Pbind, waitTicks } from '../../../util/asyncUtil';

function f(x) {
  return () => Abind(x,
    'A',
    () => Pbind(x, 'AA', 'AB'),
    'B',
    () => Pbind(x, 'BA', 'BB'),
    'C'
  )
};


A(
  f(1),
  f(2)
);