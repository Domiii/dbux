async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms)); 
}

async function g(input) {
  await sleep(100);
  return input * 3;
}

async function f(x) {
  const y = await g(x);
  const z = await g(y);
  console.log(z);
}
f(1);
f(2);

function p(x) {
  return g(x).
  then(y => g(y)).
  then(z => console.log(z));
}
p(1);
p(2);