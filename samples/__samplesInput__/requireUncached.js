const isEqual = require('lodash/isEqual');
const { writeFileSync } = require('fs');
const path = require('path');

function requireUncached(module) {
  const requireFunc = typeof __non_webpack_require__ === "function" ? __non_webpack_require__ : require;
  delete requireFunc.cache[requireFunc.resolve(module)];
  return requireFunc(module);
}

function main() {
  const f = path.resolve(process.cwd(), './data1');
  writeFileSync(f, 'module.exports = { a: "abc"}');
  const d1 = requireUncached(f).a;
  writeFileSync(f, 'module.exports = { a: "def"}');
  const d2 = requireUncached(f).a;
  console.log(isEqual(d1, d2), d1, d2);
}

main();