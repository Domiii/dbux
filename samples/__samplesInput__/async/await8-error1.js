/**
 * @file This triggers dbux error:
 *  `fixContext(1,2,4)\n [Dbux RuntimeMonitor] Tried to postAwait, but context was not registered: undefined`
 */

async function f() {
  await g();
}

async function g() {
  throw new Error('test error');
}

f();