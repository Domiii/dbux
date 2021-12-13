const assert = require('tools/assertCallbacks');

function cb() {
  console.log('cb!');
}

(async function main() {
  setTimeout(cb, 50);

  assert.not.patched(cb);
  assert.patched(Array.prototype.slice);
  
  // TODO: more testing here, with checks for multi-patching
})();
