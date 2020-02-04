function main() {
  var a = [33, 4, -14, -34, 14, 0, 999];
  var b = [];
  for (let i = 1; i < a.length; ++i) {
    b.push(identity(a[i - 1] * a[i]));
  }
  return Math.max(...identity(b));
}

function identity(x) {
  return x;
}


console.log(main());