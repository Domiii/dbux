/* eslint-disable */



function main() {
  a['i'](3, 4);
  // a.i(3, 4);
  // a.b.f(1);
  // a.g().h(2);
  // f(a.g());
  // f(a['g']());
  // a.i(a.g());
  // a['i'](a['g']());

  // a.i(a.g().h(2), a.b.f(1));

  // a.x?.();
  // a?.i(a.g?.().h?.x?.(2));
  // a?.i(a.g?.().bob?.x?.(2));
}

// f();
// f()(1);
function f(x) {
  // return function j(x, y) {
  console.log('f', x);
  return x;
  // };
}

var a = {
  get b() {
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
    return function j(x, y) {
      console.log('j', x, y);
    };
  }
};

main();


// // a.b().f(1);

// // var _o, _f;
// // _o = a.b(),
// //   _f = _o.f,
// //   BCE(),
// //   _f.call(_o, 1);


// // var _o, _f, _o2, _f2;
// // _o2 = (
// //   _o = a,
// //   _f = _o.g,
// //   _f.call(_o)
// // ),
// //   _f2 = _o2.h,
// //   _f2.call(_o2, 2)

// // var _o, _f;
// // _o = a,
// //   _f = _o.i,
// //   _f.call(_o, 3)