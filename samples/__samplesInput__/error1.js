
function f() {
  try {
    throw new Error('err');
  }
  catch (err) {
    console.error(err);
  }
}

f();
