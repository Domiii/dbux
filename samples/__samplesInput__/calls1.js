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
  }
};

a.b.f(1);

a.g().h(2);

var _o, _f;
_o = a.b,
  _f = _o.f, 
  _f.call(_o, 1);

var _o2, _f2, _o3, _f3;

_o3 = (
  _o2 = a,
  _f2 = _o2.g,
  _f2.call(_o2)
),
  _f3 = _o3.h,
  _f3.call(_o3)