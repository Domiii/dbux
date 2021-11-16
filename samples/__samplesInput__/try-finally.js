/**
 * no error
 */

function f() {
  try {
    console.log('hi');
  }
  finally {
    console.log('finally');
  }
}

f();
