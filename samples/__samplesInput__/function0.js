var f = function(x) {
  console.log('f', x);
  // throw new Error();
}
f(1);
console.log(f.toString());