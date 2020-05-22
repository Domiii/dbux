/* eslint-disable */

var a = {
  get b() {
    console.log('b');
    return {
      f(x) { console.log('f', x); }
    }
  }
};

a.b.f(1);


var _o, _f;
_o = a.b,
  _f = _o.f, 
  _f.call(_o, 1)