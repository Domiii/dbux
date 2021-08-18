var a = p(null, 'a');

var ab = p(a, 'b');
var ac = p(a, 'c');

var abd = p(ab, 'd');
var ace = p(ac, 'e');

function r(x) {
  console.log('[Resolve]', x);
  return Promise.resolve(x)
    // .then(res => res + ' .')
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
