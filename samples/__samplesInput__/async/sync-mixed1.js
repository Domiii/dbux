/**
 * 
 */
import { P } from '../../util/asyncUtil';

const p = f();

(async function main() {
  await 0;
  console.log('mainA');
  await P('mainB1', () => (console.log('mainB2'), p));
  console.log('mainC');
  // await 0;
  // console.log('mainD');
})();

async function f() {
  console.log('fA');
  await 0;
  console.log('fB');
  await 1;
  console.log('fC');
  await 2;
  console.log('fD');
  await 3;
  console.log('fE');
  await 4;
  console.log('fF');
  await 5;
  console.log('fG');
}