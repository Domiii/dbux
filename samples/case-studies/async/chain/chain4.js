import { A, P, waitTicks } from '../../../util/asyncUtil';

A(
  'A',
  () => P(
    'AA',
    [
      [
        'AAAA',
        'AAAB',
        'AAAC',
      ],
      'AAB',
      'AAC'
    ],
    'AB',
    'AC'
  ),
  'B'
);
