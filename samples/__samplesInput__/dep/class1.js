class A {
  constructor(x, o) {
    this.x = x;
    this.o = o;
  }
}

function main(a) {
  a.push(new A(1, { a: 22 }));
  a[0].o.a = 3;
  // const b = a.x;
  // a.y = b + 3;
  return a;
}

main([]);

