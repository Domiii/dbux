/**
 * @file check `callerTrace` is the actual caller of context 
 */

function cb(x) {
  return x + 1;
}

var cb2 = function (x) {
  return x + 1;
}

const a = [1, 2, 3].map(cb);
const a2 = [1, 2, 3].map(cb2);

const b = cb(1);
const b2 = cb2(1);
