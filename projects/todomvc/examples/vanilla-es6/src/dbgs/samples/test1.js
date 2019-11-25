

function test1() {
  // create object
  var a = { x: 1 };

  // track object
  __dbgs_trackObject(a, 'a');
  var c = a;
  var b = 3;

  a = { y: 33 };

  function f(arg) {
    noop(arg);
  }

  noop(a);
  // noop(b);
  // noop(c);
  // noop(b + a.x);
  // f(a);
  // f(c);
  // a.x = b * b;

  // if (a.y > 30) {
  //   noop(a);
  // }
  // else {
  //   noop(c);
  // }

  // a.x *= a.x;


  // noop(f(c));

  // class D {
  //   x = b;
  //   y = a;
  //   z = [b, c];
  // }

  // var d = new D();
}

function noop() { }


test1();