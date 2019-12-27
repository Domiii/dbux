function f1(a, b) {
  setTimeout(function f2() {
    setTimeout(f3, 300);
  });
}

function f3() {
}

// go!
setTimeout(f1.bind(null, 83, 84));