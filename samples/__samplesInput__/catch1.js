
(async function f() {
  try {
    await 0;
    throw new Error('err');
  }
  catch (err) {
    console.error(err);
  }
})();