var res1 = (() => this).call(null);
console.log(`${res1} === globalThis`, res1 === globalThis);


var res2 = f.call(1, 2, 3);
console.log(`${res2} === 1,2,3`, res2 === [1, 2, 3].toString());

function f(a, b) {
  return [this.toString(), a, b].toString();
}

var res3 = g.call(null, f);

function g(cb) {
  return console.log(cb === f);
}