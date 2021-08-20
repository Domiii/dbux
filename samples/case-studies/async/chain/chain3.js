import { R, P, waitTicks } from '../../../util/asyncUtil';

async function f(x) {
  console.log(x, 'fA');
  await P(
    x + ' fAA',
    x + ' fAB',
    x + ' fAC'
  );
  console.log(x, 'fB');
  await P(x + ' fB');
  console.log(x, 'fC');
}

(async function main() {
  await f(1);
  await f(2);
})();