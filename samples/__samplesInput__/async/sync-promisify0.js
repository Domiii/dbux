/**
 * @file similar to semantics of `queue._maybeDrain` in async-js
 * A3 syncs against future event
 * which is scheduled in B4.
 */
import { P } from '../../util/asyncUtil';

let cb;

const p = new Promise((r) => {
  cb = () => {
    r();
  };
});


// queue user
P(
  () => 'A1',
  () => ('A2', p),
  () => 'A3',
);


// queue driver
P(
  'B1',
  'B2',
  'B3',
  () => ('B4', cb()),
  'B5'
);