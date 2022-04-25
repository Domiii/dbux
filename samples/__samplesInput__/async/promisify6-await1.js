/**
 * Promisified promise nested by first await.
 * 
 * @file
 */
import { A, v } from '../../util/asyncUtil';

A(
  'A',
  async () => {
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