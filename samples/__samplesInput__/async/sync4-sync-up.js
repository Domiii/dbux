import { P, sleep } from '../../util/asyncUtil';
/**
 * 3 FORKs: main, f, g
 * 2 SYNCs: f -> main, g -> main
 */

(async function main() {
  const p = P(
    sleep(),
    () => 'p0',
    () => 'p1',
    () => 'p2'
  );
  await 0;
  console.log('mainA');
  await p;
  console.log('mainB');
  await 2;
  console.log('mainC');
  // await 0;
  // console.log('mainD');
})();
