function f1() {
}

const f2 = function _f2() {
};

const f3 = () => {
};

const o = {
  a: {},
  f4() {},
  f5: () => {}
};
o.a.f6 = () => {};

class C {
  constructor() {
    this.f7 = () => {};
  }
  f8() {}
  f9 = () => {};
}


o.f10 = function () {
};


// // generator function
// function *f8() {
//   yield 1;
//   yield 2;
// }