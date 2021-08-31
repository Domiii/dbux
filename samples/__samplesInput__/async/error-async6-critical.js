/**
 * Wraps an async function s.t. it can only execute once at a time.
 * While it executes, all other calls to the function will wait until previous executions have finished.
 */
function criticalSection(fn) {
  let criticalSectionPromise = null;
  return async (...args) => {
    // const queueId = ++criticalSectionQueueId;

    while (criticalSectionPromise) {
      try {
        await criticalSectionPromise;
      }
      catch (err) {
        // ignore error here. It should be handled on "main thread".
      }
    }

    try {
      criticalSectionPromise = fn(...args);
      const result = await criticalSectionPromise;
      return result;
    }
    finally {
      criticalSectionPromise = null;
    }

  };
}

/**
 * Async errors will throw on all `await`s.
 */

var p;

const sleep = async (ms) => new Promise(r => setTimeout(r, ms));

async function f() {
  return p = g();
}

const g = criticalSection(async function g() {
  await sleep(800);
  throw new Error('err');
});

f();
f();
f();
f();