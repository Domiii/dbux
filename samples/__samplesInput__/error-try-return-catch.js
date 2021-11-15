/**
 * no error
 */

function f() {
  try {
    console.log('hi');
    return 1;
  }
  catch (err) {
    console.error(err);
  }
  return 2;
}

f();
