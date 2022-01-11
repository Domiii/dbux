/**
 * Test basic callback identity properties when dynamic callback patcher is involved.
 */

const assert = require('tools/assertCallbacks');

function cb() {
  console.log('cb!');
}

var storedCb;

/**
 * dbux disable
 */
function nativeCallStore(cb) {
  assert.patched(cb);
  storedCb = cb;
}

/**
 * dbux disable
 */
function nativeCallCompare(cb) {
  assert.patched(cb);
  console.assert(cb === storedCb, '❌ Same callback passed in twice -> should be the same.');
}

(async function main() {
  setTimeout(cb, 50);

  assert.not.patched(cb);
  assert.patched(Array.prototype.slice);

  /**
   * Call function with same cb twice:
   * -> it should be recognized as the same cb, or else `removeEventListener`
   *    and many other callback management mechanisms cannot work correctly.
   */
  nativeCallStore(cb);
  debugger;
  nativeCallCompare(cb);

  // TODO: more testing here, with checks for multi-patching
})();
