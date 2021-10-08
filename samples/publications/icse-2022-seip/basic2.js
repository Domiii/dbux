import { P, sleep } from '../../util/asyncUtil';

function f(x) {
  return function identity() { 
    return x;
  };
}

async function main() {
  f('create p')();
  const p = P(sleep(1000), f('WAIT'));
  await 0;
  f('START')();
  await Promise.all([
    P(f('A1'),
      () => Promise.all([
        P(f('B11'), f('B12'), f('B13')),
        P(f('B21'), f('B22'), f('B31'))
      ])
    , f('A2'), f('A3')),
    P(f('D1'), f('D2'), f('D3')),
    p
  ]);
  f('END')();
}
main();