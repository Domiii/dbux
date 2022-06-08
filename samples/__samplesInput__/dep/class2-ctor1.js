class A {
  constructor(x, xx, o) {
    this.x = x;
    this.xx = xx;
    this.o = o;
  }
}

function main(a) {
  var xx = 44;
  a.push(new A(a[0], xx, { a: 22 }));
  a[1].o.a = 3;
  // const b = a.x;
  // a.y = b + 3;
  return a;
}

main([112]);

