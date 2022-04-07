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
    console.error('ERROR', err, x);
  }
  finally {
    console.log('finally', x);
  }
}

for (var x of f()) {
}