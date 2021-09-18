/**
 * @file
 * Executor resolve also takes in promises.
 */

new Promise((r) => (console.log(1), r(
  (async () => {
    console.log(2);
    await 0;
    console.log(3);
    await 0;
    console.log(4);
    return 'result';
  })()
))).then(() => console.log('done'));