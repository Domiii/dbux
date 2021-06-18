function f() {
  console.log(1);
  throw new Error('errrrrror');
  console.log(2);
}

try {
  f();
}
catch (err) {
  console.error(err.stack);
}


