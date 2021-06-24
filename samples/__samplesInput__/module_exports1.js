exports.f = function f(n) {
  if (n) {
    f(--n);
  }
};


exports.f(2);