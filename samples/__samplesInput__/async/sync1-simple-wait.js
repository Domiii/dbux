const fResultPromise = f();
async function f() {
  await 0;
  await 1;
  await 2;
}
(async function g() {
  await 0;
  await fResultPromise;
})();
