import { A, Ar } from '../../../util/asyncUtil';

// A(
//   'A',
//   () => Ar(
//     'BA',
//     async () => A('BBA', 'BBB'),
//   ),
//   'C'
// );


async function f() {
  await 'A';
  await g();
  await 'C';
}

async function g() {
  await 'BA';
  return h();
}

async function h() {
  await 'BBA';
  await 'BBB';
}

f();