// module.exports = Test;

// console.log(Object.keys(Object.assign({}, module)));

// function Test() {
// }

exports.f = function f(n = 1) {
  if (n) {
    f(n);
  }
};