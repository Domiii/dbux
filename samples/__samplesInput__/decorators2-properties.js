function p() {
  return (x) => x;
}

class A {
  @p()
  tableState;
}

console.log(new A().x, '=== 1', new A().tableState, '=== undefined');
