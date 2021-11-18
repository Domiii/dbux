/**
 * @file similar to semantics of `queue._maybeDrain` in async-js
 */
import { P } from '../../util/asyncUtil';

let p;

P(
  'A1',
  'A2',
  () => {
    p = new Promise(r => {
      console.log('A31');
      setImmediate(() => setImmediate(r));
    });
  },
  () => p.then(() => 'A4'),
  'A5'
);