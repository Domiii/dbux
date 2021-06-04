(function f() {
  // NOTE: `arguments` captures only what was passed to function. Ignores default parameters.
  var x = arguments;
  console.log(x);
})(1, 'x', g, 2);

function g() { return 'hi'; }