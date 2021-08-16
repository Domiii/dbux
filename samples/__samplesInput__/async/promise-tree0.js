var a = p(null, 'a');

var ab = p(a, 'b');

function r(x) {
  console.log('[Resolve]', x);
  return Promise.resolve(x)
    .then(res => res + ' .')
    .then(res => res + ' .');
}

function p(previousPromise, x/* , n */) {
  if (!previousPromise) {
    return r(x);
  }
  return previousPromise.then(
    (previousResult) => r(`${previousResult} ${x}`)
  );
}
