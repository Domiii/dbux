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
  @p({ attribute: 'id' })
  x = 1;

  @p()
  tableState;
}

console.log(new A().x, '=== 1', new A().tableState, '=== undefined');
