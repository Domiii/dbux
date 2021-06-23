function g(x) {
  if (0 == arguments.length) {
    var y = 100;
    console.log(x, y);
  }
}

function f(x) {
  if (0 == arguments.length) {
    var x = 123;
    console.log(x);
  }
}

f(1);