/**
 * Make sure that proxies are not traced by default (for now).
 */

const a = 123;

var o = {
  a
};

var p = new Proxy({ a: -1 }, {
  get(target, prop) {
    if (prop === 'a') {
      console.debug('accessed a', a);
      return a;
    }
    return 0;
  }
});


console.log(o.a, p.a);