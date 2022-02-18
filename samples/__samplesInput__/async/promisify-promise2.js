/**
 * In some odd edge cases, promises are promisified.
 * 
 * @file
 */
import { P, v } from '../../util/asyncUtil';

P(
  'A',
  () => new Promise(r => {
    v('B');
    P(() => {
      v('B1');
      P(() => {
        v('B11');
        r(P(() => {
          v('B111');
        }));
      });
    });
    // P(() => {
    //   v('B2');
    //   r();
    // });
  })
    .then(() => {
      v('C')
    })
);