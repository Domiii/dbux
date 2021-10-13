/**
 * 
 */
import { P } from '../../util/asyncUtil';


var p = P('A1');

P(p,
  'B1',
  'B2',
  'B3'
);

P(p,
  () => 'C1',
  'C2',
  'C3'
);