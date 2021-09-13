import { P } from '../../../util/asyncUtil';

var p = Promise.resolve('A').then(() => 'AA');
p.then(() => 'B');
p.then(() => 'C');
