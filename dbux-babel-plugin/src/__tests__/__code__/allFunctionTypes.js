function f1() {

}

const f2 = function _f2() {

};

const f3 = () => {

};

const o = {
  f4() {},
  f5: () => {}
};

class C {
  f6() {}
  f7 = () => {};
}

// // generator function
// function *f8() {
//   yield 1;
//   yield 2;
// }