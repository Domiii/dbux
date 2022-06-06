function main(a) {
  // Array(20).fill(0).map(i => Math.round((Math.random() * 2 - 1) * 100))

  var b = [];
  for (let i = 1; i < a.length; ++i) {
    b.push(a[i - 1] * a[i]);
  }
  return Math.max(...b);
}

// function identity(x) {
//   return x;
// }


console.log(main([-96, 81, 8, -39]));
