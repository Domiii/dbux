function f1(a, b) {
  setTimeout(function f2() {
    setTimeout(f3, 300);
  });
}

function f3() {
  f4(1, (...args) => console.log(...args), 2, () => {return 1;});
}

function f4(a, cb, b, cb2) {
  cb(a, b);
  cb2();
}

// go!
setTimeout(f1.bind(null, 83, 84));