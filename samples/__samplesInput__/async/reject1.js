/**
 * @file `catch` can also nest promises.
 */

Promise.resolve().then(() => ERR)
  .catch(err => {
    console.error(1, 'err', err);
    return Promise.resolve()
      .then(() => console.log(2))
      .then(() => console.log(3))
  }).then(() => console.log(4));