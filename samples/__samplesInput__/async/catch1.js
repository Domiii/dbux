
function g() {
  console.log('g1');
}

function h() {
  console.log('h1');
  throw new Error('err');
}

(async function f() {
  try {
    console.log('f1');
    await 1;
    var p = Promise.resolve()
      .then(g)
      .then(h);
    var q = p.catch((err) => {
      console.error('ERR (promise) -', err);
      throw new Error('err2 <- ' + err?.message);
    });
    await q;
  }
  catch (err) {
    console.error('ERR (f) -', err);
    await 'fin';
  }
  // finally {
  //   console.log('f2');
  // }
})();
