/**
 * In some odd edge cases, async function calls are promisified.
 * E.g. in `retry-as-promised`, which is heavily used by `sequelize`.
 * 
 * @file
 */
import { P, v } from '../../util/asyncUtil';

P(
  'A',
  () => new Promise(r => {
    v('B');
    (async () => {
      await 0;
      console.log(v('B2'))
      r();
    })();
  }),
  'C'
);
