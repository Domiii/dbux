/* dbux disable */
function e() {
  throw new Error('err');
}

function f() {
  e();
  // try {
  //   e();
  // }
  // catch(err) {
  //   console.error(err);
  // }
}

f();