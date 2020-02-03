function f1(ms) {
  setTimeout(function f2() {
    setTimeout(f3, ms);
  });
}

function f3() {
  f4(
    1,
    (...args) => console.log(...args),
    2,
    () => { return 1; },
    3
  );
}

function f4(a, cb, b, cb2) {
  cb(a, b);
  setTimeout(() => cb2(), 1500);
}

// go!
setTimeout(
  () => { f1(1500); },
  1500
);