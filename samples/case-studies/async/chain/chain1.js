import { A, P, waitTicks } from '../../../util/asyncUtil';

A(
  'A',
  'B',
  [
    'BA',
    'BB'
  ],
  async () => 'C',
  'D'
);