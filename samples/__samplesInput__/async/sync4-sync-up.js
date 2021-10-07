/**
 * Spoilers: syncing via UP is not possible.
 */

import { P, sleep } from '../../util/asyncUtil';
/**
 * 3 FORKs: main, f, g
 * 2 SYNCs: f -> main, g -> main
 */

async function f(p) {
  await p;
  await 0;
  await 1;
}

(async function main() {
  const p = P(
    sleep(),
    () => 'p0',
    () => 'p1',
    () => 'p2'
  );
  console.log('mainA');
  // await 0;
  f(p);
  f(p);
  // await p;
  console.log('mainB');
  await 2;
  console.log('mainC');
  // await 0;
  // console.log('mainD');
})();
