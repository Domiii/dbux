function g() {}

function f(obj) {
  console.log(g(obj)?.h());
}

f(['hi']);
