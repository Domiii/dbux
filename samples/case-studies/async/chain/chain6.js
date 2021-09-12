import { A, P } from '../../../util/asyncUtil';

function f() {
  console.log('f');
  return 123;
}

A(
  'A',
  () => new Promise(r =>
    Promise.resolve(A('BA', 'BB'))
      .then(r)
      .then(f)
  ),
  'C'
);