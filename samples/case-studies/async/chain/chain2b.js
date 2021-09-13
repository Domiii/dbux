import { A, Abind, Pbind } from '../../../util/asyncUtil';

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
  'A',
  () => {
    var p = Promise.resolve();
    p.then(f(1));
    p.then(f(2));
    
    return p;
  }
);