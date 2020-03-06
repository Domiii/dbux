(function () {
  let _lastId = 0;

  function awaitId() {
    const result = ++_lastId;
    log('[awaitId]', result);
    return result;
  }

  async function wrapAwaitExpression(id, awaitValue) {
    log('[wrapAwaitExpression]', id);
    // const res = await awaitValue;
    // log('[wrapAwaitExpression] post', id);
    return awaitValue;
  }

  function wrapAwait(awaitResult, id) {
    log('[wrapAwait]', id);
    return awaitResult;
  }


  async function sleep(ms) {
      console.log('finished sleeping:', ms);
    return Promise.resolve(ms);
    // return new Promise(r => setTimeout(() => {
    //   console.log('finished sleeping:', ms);
    //   r();
    // }, ms));
  }

  function log(...args) {
    console.warn(...args);
    return true;
  }

  async function f1() {
    log('[f1] push');
    let id;
    wrapAwait(await wrapAwaitExpression(id = awaitId(), sleep(10)), id);
    log('[f1] pop', id);
  }

  (async function main() {
    log('[main] push');
    let id;
    wrapAwait(await wrapAwaitExpression(id = awaitId(), f1()), id);
    log('[main] pop', id);
  })();

  log('[program] pop\n\n-------------------------------\n');
})();