function p() {
  return (target, prop, val) => {
    target[prop] = val;
  };
}

class A {
  @p()
  tableState;
  @p()
  x = 1;
}

console.log(new A().x, '=== 1', new A().tableState, '=== undefined');
