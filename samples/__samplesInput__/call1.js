var res1 = f.call(1, 2, 3);
console.log(`${res1} === 1,2,3`, res1 === [1, 2, 3].toString());

function f(a, b) {
  return [this.toString(), a, b].toString();
}

// var res2 = (() => this).call(null);
// const fileLevelThis = this;
// console.log(`${res2} === fileLevelThis`, res2 === fileLevelThis);



// var res3 = g.call(null, f);

// function g(cb) {
//   return console.log(cb === f);
// }