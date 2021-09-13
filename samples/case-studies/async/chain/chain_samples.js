import { A, Ar, P } from '../../../util/asyncUtil';

const ArDefault = () => Ar(1, 2);
const ArEmpty = () => Ar();
const a = 'a';
const x = 'x';

P(0, ArDefault, x);
P(0, ArEmpty, x);

/** ###########################################################################
 * GNP cases
 * ##########################################################################*/


// Case 1: link is AsyncReturn, nestedUpdate is PostAwait
Ar(a, A('n1', 'n2'));

// Case 2: link is AsyncReturn, nestedUpdate is PostThen
Ar(a, P('n1', 'n2'));

// Case 3: link is ThenNested, nestedUpdate is PostAwait
P(a, A('n1', 'n2'));

// Case 4: link is ThenNested, nestedUpdate is PostThen
P(a, P('n1', 'n2'));

