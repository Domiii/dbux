/**
 * @file
 */

const { P, v, sleep } = require('../../util/asyncUtil');

P()
  .then(() => v('A'))
  .then(() =>
    Promise.all(
      [1, 2].map(x =>
        P(
          async () => {
            await sleep();
            return P(`B${x}`);
          }
        )
      )
    )
  )
  .then(() => v('C'));
