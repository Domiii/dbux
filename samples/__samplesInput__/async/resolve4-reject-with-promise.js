/**
 * @file
 * Executor reject is also postponed by nested promise.
 * However, it will pass the promise (not its resolved value) to `catch`!?
 */

new Promise((r, j) => (console.log(1),
  j(
    (async () => {
      console.log(2);
      await 0;
      console.log(3);
      await 0;
      console.log(4);
      return 'result';
    })()
  )
)).then(() => console.log('done')).catch((err) => console.warn('err', err));