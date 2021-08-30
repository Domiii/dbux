
function f() {
  throw new Error('err');
}

function g() {
  console.log('g1');
  try {
    f();
  }
  finally {
    console.log('g2');
  }
  console.log('g3');
}

// try {
g();
// }
// catch (err) {
  
// }
