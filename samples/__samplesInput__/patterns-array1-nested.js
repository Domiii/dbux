function main(_a) {
  // 1. this slice makes things complicated
  var a = _a.slice();

  const i = 1;
  const j = 0;

  // 2. make sure nested swap + patterns work
  [
    a[j][i],
    a[i][j],
  ] = [
      a[i][j],
      a[j][i],
    ];

  return a;
  // return a[0];
}

console.log(main([[1, 2], [3, 4]]));
