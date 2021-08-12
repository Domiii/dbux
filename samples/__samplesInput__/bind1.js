var ff = f.bind(1, 2, 3);
var res1 = ff(4, 5);
console.log(`${res1} === 1,2,3,5`, res1 === [1, 2, 3, 4, 5].toString());

function f(a, b, c, d = 0) {
  return [this.toString(), a, b, c, d].toString();
}
