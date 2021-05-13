
async function g(x) {
  console.log('g1')
  await 0;
  console.log('g2')
}

async function f(x) {
  console.log('f1')
  await g(x);
  console.log('f2')
}


let waits = 0;
waitOne().then(waitOne).then(waitOne).then(waitOne)

f(1);

function waitOne() {
  console.log('wait', ++waits);
  return Promise.resolve().then(()=>{});
}
