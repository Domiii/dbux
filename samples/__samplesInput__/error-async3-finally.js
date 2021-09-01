
async function f() {
  await 0;
  throw new Error('err');
}

async function g() {
  console.log('g1');
  try {
    await 0;
    await f();
    console.log('g2');
  }
  finally {
    console.log('g3');
  }
}

async function h() {
  console.log('h1');
  try {
    await 0;
    await g();
    console.log('h2');
  }
  finally {
    console.log('h3');
  }
}

h();
