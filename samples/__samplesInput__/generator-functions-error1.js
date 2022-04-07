const O = 1;

function* g(x, y) {
  yield 0;
  throw new Error('OUCH');
  yield 1;
}

function* f(x) {
  try {
    // yield 0;
    yield* g(x, 1);
    yield 1;
  }
  catch (err) {
    console.error('ERROR', err, O, x);
  }
  finally {
    console.log('finally', O, x);
  }
}

for (var x of f()) {
}