/* eslint-disable */

var a = {
  get b() {
    console.log('b');
    return {
      f(x) { console.log('f', x); }
    }
  },

  g() {
    console.log('g');
    return {
      h(x) {
        console.log('h', x);
      }
    };
  },

  get i() {
    console.log('i');
    return function j(x) {
      console.log('j', x);
    };
  }
};

a.b.f(1);

a.g().h(2);

a.i(3);

console.log(' ');

var _o, _f;
_o = a.b,
  _f = _o.f,
  _f.call(_o, 1);

var _o, _f, _o2, _f2;
_o2 = (
  _o = a,
  _f = _o.g,
  _f.call(_o)
),
  _f2 = _o2.h,
  _f2.call(_o2, 2)

var _o, _f;
_o = a,
  _f = _o.i,
  _f.call(_o, 3)