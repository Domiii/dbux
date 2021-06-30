class A {

}

class B extends A {
  constructor() {
    var x = 3;
    super();
  }

  f() { }
  #pf() { }
}


new B();