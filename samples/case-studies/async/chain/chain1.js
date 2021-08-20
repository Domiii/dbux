import { R, P, waitTicks } from '../../../util/asyncUtil';

async function f(x) {
  console.log('fA', x);
  await 0;
  console.log('fB', x);
  await 0;
  console.log('fC', x);
}

(async function main() {
  await f(1);
  await f(2);
})();