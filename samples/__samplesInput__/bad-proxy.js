var o = {};

var p = new Proxy(o, {
  get() {
    throw new Error('OUCH');
  }
});

console.log(p);
