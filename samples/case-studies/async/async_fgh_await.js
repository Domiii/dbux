function sleep() {
  return new Promise((r) => setTimeout(r));
}
async function f() { await sleep(); }
async function g() { await sleep(); }
async function h() { await sleep(); }

// 1
(async function () {
  await f();
  await g();
  await h();
})();

// 2
(async function () {
  g();
  await f();
  await h();
})();

// 3
(async function () {
  await f();
  g();
  await h();
})();

// 4
(async function () {
  await f();
  h();
  await g();
})();

// 5
(async function () {
  await f();
  await g();
  h();
})();

// 6
(async function () {
  g();
  h();
  await f();
})();

// 7
(async function () {
  g();
  await f();
  h();
})();

// 8
(async function () {
  await f();
  g();
  h();
})();

// 9
(async function () {
  async function g() {
    await sleep();
    h();
  }

  await f();
  g();
})();