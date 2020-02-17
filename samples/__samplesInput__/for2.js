function main() {
  // Array(20).fill(0).map(i => Math.round((Math.random() * 2 - 1) * 100))
  var a = [-96, -81, 87, 78, -61, -27, -22, -24, 10, 40, 5, 8, -81, 70, 6, 89, -36, 22, -62, -39];
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
