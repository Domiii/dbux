/**
 * @file Promise.all with a bit of nesting going on.
 */

const { P, v, sleep } = require('../../util/asyncUtil');

P()
  .then(() =>
    Promise.all(
      [1, 2].map(x =>
        P(
          () => {
            return P(`A${x}`);
          }
        )
      )
    )
  )
  .then(() => v('B'));
