
function f(g) {
  g.call(null, 1);
}

f(function __g() { console.log('__g'); });