/**
 * @file similar to semantics of `queue._maybeDrain` in async-js
 */
import { P } from '../../util/asyncUtil';

let cb;

const p = P('S1', () => new Promise((r) => {
  'S2';
  cb = () => {
    r();
  };
}));


// queue user
P(
  'A1',
  () => ('A2', p),
  () => 'A3',
);


// queue driver
P(
  'B1',
  'B2',
  'B3',
  // () => ('B4', setImmediate(cb)),
  () => new Promise((r) => setImmediate(() => {
    'B4';
    cb();
    r();
  })),
  'B5'
);