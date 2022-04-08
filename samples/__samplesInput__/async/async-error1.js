const O = 1;

async function g(x, y) {
  await 0;
  throw new Error('OUCH');
  await 1;
}

async function f(x) {
  try {
    await 0;
    await g(x, 1);
    await 1;
  }
  catch (err) {
    console.error('ERROR', err, O, x);
  }
  finally {
    console.log('finally', O, x);
  }
}

f();