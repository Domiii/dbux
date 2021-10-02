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

Abind('[A1]', ...ablauf);

Pbind('[P1]', ...ablauf);

Pbind('[P2]', [
  'A',
  'B',
  () => Promise.resolve().then(() => Pbind('[P2]',[
    'CA',
    'CB',
    'CC',
  ])),
  'D'
]);
