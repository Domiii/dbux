import { P } from '../../util/asyncUtil';
const A = 0, B = 1, G = 2;


async function f() { 
  P(1, 2, () => P(3));
}

async function f2() {
  P(1, () => P(2), 3);
}

(async function main() {
  await 0;

  f();
  f2();
})();