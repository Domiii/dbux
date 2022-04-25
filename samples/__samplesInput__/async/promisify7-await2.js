/**
 * Promisified promise nested by non-first await.
 * 
 * @file
 */
import { A, v } from '../../util/asyncUtil';
A(
  'A',
  async () => {
    v('B0')
    await 0;
    await new Promise(r => {
      v('B1');
      setTimeout(() => {
        console.log(v('B2'))
        r();
      });
    })
  },
  'C'
);