/**
 * In some odd edge cases, async function calls are promisified.
 * E.g. in `retry-as-promised`, which is heavily used by `sequelize`.
 * 
 * @file
 */
import { A, v } from '../../util/asyncUtil';

A(
  'A',
  () => new Promise(r => {
    v('B1');
    setTimeout(() => {
      console.log(v('B2'))
      r();
    });
  }),
  'C'
);