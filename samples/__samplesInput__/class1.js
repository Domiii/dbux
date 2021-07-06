class A {
  constructor() { 
    console.log('new A');
    this.x = 3;
  }

  f() {}
  g() {}
}

var a = new A();

console.log(a.x);