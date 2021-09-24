import { Abind, Pbind } from '../../../util/asyncUtil';

const ablauf = [
  'A',
  'B',
  [
    'CA',
    'CB',
    'CC',
  ],
  'D'
];

Abind('[A]', ...ablauf);

Pbind('[P]', ...ablauf);
