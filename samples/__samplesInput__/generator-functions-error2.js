function* f(x) {
  try {
    yield 0;
    yield 1;
  }
  catch (err) {
    console.error('ERROR', err, x);
  }
  finally {
    console.log('finally', x);
  }
}

const gen = f(1);

gen.next();

/**
 * NOTE: this is (for example) what redux-saga's `call` does.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/throw
 * @see https://github.com/redux-saga/redux-saga/blob/24e9a68d621fd2a57a29b3b80e4b54ecb22fa593/packages/core/src/internal/proc.js#L76
 */
gen.throw(new Error('OUCH'));