// require('./asyncUtil.js');

function f () {
  const p = new Promise(g);
  p.then(h);
}

function g(r, reject) {
  setTimeout(() => r(123), 1000);
}

function h(res) {
  console.log(res);
}

f();