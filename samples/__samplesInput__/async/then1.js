let p = Promise.resolve().
  then(f1);

p.then(f2).
  then(f3);

p.then(f4).
  then(f5);


function f1() { }
function f2() { }
function f3() { }
function f4() { }
function f5() { }