
function f(x, cb1, cb2) {
  setTimeout(() => {
    cb1(cb2);
  });
  console.log('f', x);
}

function g(cb) {
  cb();
  console.log('g');
}

function h() {
  console.log('h');
}

function i() { }

f(3, g, h, i); // i is a cb that was never called!


