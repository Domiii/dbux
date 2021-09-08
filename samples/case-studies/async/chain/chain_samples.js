import { A, Ar, P } from '../../../util/asyncUtil';

const ArDefault = () => Ar(1, 2);
const ArEmpty = () => Ar();
const x = 'x';

/** ###########################################################################
 * samples
 * ##########################################################################*/

P(0, ArDefault, x);

P(0, ArEmpty, x);
