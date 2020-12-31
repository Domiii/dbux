async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms)); 
}

function g(input) {
  // await sleep(100);
  console.log('g', input);
  return input * 3;
}

async function a(x) {
  const y = await g(x);
  const z = await g(y);
  console.log(z);
}
a(1);
console.log('a2');
a(2);

// function p(x) {
//   return g(x).
//   then(y => g(y)).
//   then(z => console.log(z));
// }
// p(1);
// p(2);