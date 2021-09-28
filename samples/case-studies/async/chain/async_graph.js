import { A, Abind, Pbind } from '../../../util/asyncUtil';

function multiChain(a, b) {
  const p = Promise.resolve();
  p.then(() => 'f1');
  p.then(() => 'f2');
  return p;
}

async function main() {
  await 0;
  await multiChain();
  await 1;
}

main();

// const ablauf = [
//   multiChain(() => A('A'), () => A('B'))
// ];

// Abind('[A]', ...ablauf);

// Pbind('[P]', ...ablauf);
