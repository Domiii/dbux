async function f(x) {
  for (; x; --x) {
    await x;
  }
}
(async function g() {
  await 0;
  await Promise.all(
    [4, 2, 1].map(x => f(x))
  );
  await 2;
})();
