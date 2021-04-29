
async function g(x) {
  await 0;
}

async function f(x) {
  await g(x);
}

f(1);