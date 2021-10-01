/**
 * 
 */
import { P } from '../../util/asyncUtil';

var p = P('A1', 'A2', 'A3', 'A4', 'A5');

P(
  () => 'B1',
  () => ('B2', p),
  () => 'B3'
);