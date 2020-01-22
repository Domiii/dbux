function main() {
  var a = [33, 4, -14, -34, 14, 0, 999];
  var b = [];
  for (let i = 1; i < a.length; ++i) {
    b.push(a[i - 1] * a[i]);
    identity(b);
  }
  return Math.max(...b);
}


function identity(x) {
  return x;
}


console.log(main());
console.debug("6asdas7dasds7ad7");