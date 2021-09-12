import { A, P, waitTicks } from '../../../util/asyncUtil';

A(
  'A',
  'B',
  [
    'BA',
    async () => 'BB',
  ],
  'D'
);