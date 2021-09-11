import { A, P, waitTicks } from '../../../util/asyncUtil';

A(
  'A',
  () => P(
    'AA',
    [
      [
        'AAAA',
        'AAAB'
      ],
      'AAB',
      'AAC'
    ],
    'AB',
    'AC'
  ),
  'B'
);
