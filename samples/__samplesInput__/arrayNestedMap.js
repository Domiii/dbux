const a = [[1, 2, 3, 4, 5], [1, 2, 3], [1, 2, 3], [1, 2, 3]];

a.map(function mapSquare(arr) {
  return arr.map(x => x * x);
});

console.log(a);