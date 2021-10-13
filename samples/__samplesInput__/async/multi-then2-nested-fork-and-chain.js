/**
 * 
 */
import { P } from '../../util/asyncUtil';


P(
  // 'A1',
  () => {
    var p = P();
    
    var q1 = P(p,
      'B1',
      'B2',
      'B3'
    );

    var q2 = P(p,
      () => 'C1',
      'C2',
      'C3'
    );

    return q2;
  }
);