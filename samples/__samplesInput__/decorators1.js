function f(...args) {
  console.log('f', ...args);
  return (x) => { return x; };
}

function p() {
  return (x) => x;
}

class B {

}

@f('article-row'/* , { extends: 'tr' } */)
class A extends B {
  x = 1;
}

console.log(new A().x, ' === 1');
