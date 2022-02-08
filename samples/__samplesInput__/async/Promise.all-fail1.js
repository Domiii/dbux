/**
 * @file If a "middle promise" fails, previously unsettled promises are on their own.
 */

const { P, sleep } = require('../../util/asyncUtil');

P()
  .then(() => 'A')
  .then(() =>
    Promise.all(
      [1, 2, 3].map(x =>
        P(
          async () => {
            await sleep();
            if (x === 2) {
              throw new Error('FAIL');
            }
            return P(`B${x}`);
          }
        )
      )
    )
  )
  .catch(err => 'ERR')
  .then(() => 'C');
