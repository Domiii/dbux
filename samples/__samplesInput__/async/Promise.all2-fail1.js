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
    [1, 2, 3, 4, 5].map(x => P(
      async () => {
        await sleep();
        return P(`B${x}-1`);
      },
      async () => {
        await sleep();
        if (x === 3) {
          throw new Error('FAIL');
        }
        return P(`B${x}-2`);
      }
    ))
  )
    .catch(err => 'C'),
  'D',
  'E'
];

P(...nodes);

// Pbind('A', ...nodes);
// Pbind('P', ...nodes);
