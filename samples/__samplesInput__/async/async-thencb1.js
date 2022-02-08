const { A, P, sleep } = require('../../util/asyncUtil');

P(
  'A',
  async () => {
    await sleep();
    return P()
      .then(() => 'B');
  },
  () => {
    return P('C');
  },
  () => {
    return A('D');
  }
)
.catch(err => {
  throw new Error('err! - ' + err.stack);
});

// P(
//   'A',
//   [1, 2, 3, 4, 5].map(y => P(
//     async () => {
//       // await sleep();
//       return P(`B${y}-1`);
//     },
//     async () => {
//       // await sleep();
//       return P(`B${y}-2`);
//     }
//   ))
// );
