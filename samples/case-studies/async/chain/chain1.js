import { A, P, waitTicks } from '../../../util/asyncUtil';

A(
  'A',
  [
    'BA',
    async () => 'BB',
  ],
  'C'
);