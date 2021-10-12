/**
 * @file This logic is observed in socket.io.
 */

var n = 0;

var o = {};

Object.defineProperty(o, 'x', {
  set(val) {
    console.trace('SET');
    ++n;
  }
});

o.x = 3;
console.log('n: ', [n, 1]);
