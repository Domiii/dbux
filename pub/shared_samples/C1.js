import { F, P, sleep } from '../../util/asyncUtil';

const p = P(F(1), sleep(1000));
P(() => p, F(4));

