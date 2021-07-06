function f() {
  return o;
}

var o = {
  g() {
    return this;
  },
  h() {
    return 3;
  }
};

// o.p.q;
console.log(f().g().g().g().h());