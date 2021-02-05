(function f() {
  var x = arguments;
  console.log(x);
})(1, 'x', g, 2);

function g() { return 'hi'; }