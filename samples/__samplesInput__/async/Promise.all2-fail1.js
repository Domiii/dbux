/**
 * @file If a "middle promise" fails, remaining promises are on their own.
 */

const { P, Pbind, sleep } = require('../../util/asyncUtil');

const nodes = [
  'A',
  // [
  //   'BA',
  //   'BB'
  // ],
  () => Promise.all(
    [1, 2, 3, 4, 5].map(y => P(
      () => {
        // await sleep();
        return P(`B${y}-1`);
      },
      () => {
        // await sleep();
        return P(`B${y}-2`);
      }
      // ...[1, 2].map(x => {
      //   if (x === 2 && y === 3) {
      //     return () => { throw new Error('FAIL'); }
      //   }
      //   return async () => {
      //     await sleep();
      //     return P(`B${y}-${x}`);
      //   };
      // })
    ))
  )
    .catch(err => 'C'),
  'D',
  'E'
];

P(...nodes);

// Pbind('A', ...nodes);
// Pbind('P', ...nodes);
