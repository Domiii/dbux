// NOTE: `new` expression instrumentation is mostly the same as normal `CallExpression` instrumentation

function main() {
  new A();

  new o.B();

  new A(new o.B());
  new A(new (o.getA())());
}

class A {
  constructor() { 
    this.str = 'MY STRING';
    console.log('new A');
  }
}

class B {
  constructor() { console.log('new B'); }
}

const o = {
  B,
  getA() {
    return A;
  }
};

main();