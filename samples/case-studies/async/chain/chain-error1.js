import { A, P } from '../../../util/asyncUtil';

A(
  'A',
  () => P(
    'BA',
    [
      [
        () => { throw new Error('err') },
        'BAAB'
      ],
      'BAB'
    ],
    'BB'
  ).catch(err => {
    console.error(`C (err)`, err);
  }),
  'D',
  'E'
);
