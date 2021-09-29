/**
 * @file similar to semantics of `queue._maybeDrain` in async-js
 */
import { P } from '../../util/asyncUtil';

let cb;

const p = new Promise((r, j) => {
  cb = () => {
    r();
  }
});


// queue user
P(
  'A1',
  () => p,
  () => 'A3',
);


// queue driver
P(
  'B1',
  'B2',
  'B3',
  // () => setImmediate(cb),
  () => new Promise((r) => setImmediate(() => {
    cb();
    r();
  })),
  'B5'
);