/**
 * @file similar to semantics of `queue._maybeDrain` in async-js
 */
import { P } from '../../util/asyncUtil';



P(
  'A1',
  'A2',
  () => new Promise(r =>
    setImmediate(r)
  ),
  () => 'A4',
  'A5'
);