/**
 * Promisified promise nested via AsyncReturn, without `await`.
 * 
 * @file
 */
import { A, v } from '../../util/asyncUtil';

A(
  'A',
  async () => new Promise(r => {
    v('B1');
    setTimeout(() => {
      console.log(v('B2'))
      r();
    });
  }),
  'C'
);