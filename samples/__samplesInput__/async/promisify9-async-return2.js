/**
 * Promisified promise nested via AsyncReturn, with `await`.
 * 
 * @file
 */
import { A, v } from '../../util/asyncUtil';

A(
  'A',
  async () => {
    v('B0')
    await 0;
    return new Promise(r => {
      v('B1');
      setTimeout(() => {
        console.log(v('B2'))
        r();
      });
    })
  },
  'C'
);