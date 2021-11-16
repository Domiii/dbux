/**
 * no error
 */

function f() {
  try {
    console.log('hi');
    return 1;
  }
  finally {
    console.log('finally');
  }
}

f();
