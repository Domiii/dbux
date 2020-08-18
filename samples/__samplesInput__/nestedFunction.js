function f() {
  function g(num) {
    const x = num;
    function h() {
      console.log(x);
      debugger;
    }
    h();
  }

  g(1);
  g(2);
}

f();