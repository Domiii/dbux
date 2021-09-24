/**
 * `bind`, `apply` and `call` are native wrappers around functions.
 * We need to make sure:
 * 1. the underlying function gets the correct input and output `DataNode` linkage
 * 2. the resulting function is dealt with correctly by `CallbackPatcher`
 * 
 * @file 
 */

function f(x, cb, cb2) {
  console.log(`f() , x=${x}`);

  setTimeout(cb);

  cb2?.();
}

f.call(null, 1, () => console.log('call'));

f.apply(null, [2, () => console.log('apply')]);

var f2 = f.bind(null, 3, () => { console.log('bind'); });
setTimeout(() => {
  f2();
});