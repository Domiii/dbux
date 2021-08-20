import { R, P, waitTicks } from '../../../util/asyncUtil';

async function f(x) {
  console.log(x, 'fA');
  await P(x + ' fAA');
  console.log(x, 'fB');
  await P(x + ' fBA');
  console.log(x, 'fC');
}

(async function main() {
  await f(1);
  await f(2);
})();