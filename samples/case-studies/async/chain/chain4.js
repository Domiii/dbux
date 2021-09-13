import { A, P } from '../../../util/asyncUtil';

// P('A', 'B', 'C');
A(
  'A',
  () => 
  P(
    'BA',
    [
      [
        'BAAA',
        'BAAB'
      ],
      'BAB',
      'BAC'
    ],
    'BB',
    'BC'
  ),
  'B'
);
