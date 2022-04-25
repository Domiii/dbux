
async function g() {
  await 0;
  // throw new Error('err');
}

(async function f() {
  try {
    await 0;
    await g();
  }
  catch (err) {
    console.error(err);
  }
})();