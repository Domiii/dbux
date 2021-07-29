class A { 
  constructor(...args) { 
    console.log('A.ctor', ...args);
  }
}

class B extends A {
}
new B(1 ,2);