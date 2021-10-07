import { P } from '../../util/asyncUtil';

async function f() {
  await P();
  await 1;
  await Promise.all([
    P('A1', 'A2', 'A3'),
    P('B1', 'B2', 'B3')
  ]);
  await 2;
}
f();