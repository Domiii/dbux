import { A, P, waitTicks } from '../../../util/asyncUtil';

A(
  () => 'A',
  () => 'B',
  [
    () => 'CA',
    async () => 'CB',
  ],
  () => 'D'
);