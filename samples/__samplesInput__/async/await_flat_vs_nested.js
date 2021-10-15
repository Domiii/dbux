import { P } from '../../util/asyncUtil';
const A = 0, B = 1, G = 2;


async function f() { 
  async function g() {}
  await A;
  await g();
}

async function f2() {
  async function g() { await A; }
  await g();
}

(async function main() {
  await 0;

  f();
  f2();
})();