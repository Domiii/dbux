function f() {
  console.log(1);
  throw new Error('errrrrror');
  console.log(2);
}

f();