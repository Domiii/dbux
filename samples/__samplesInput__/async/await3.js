async function waitTicks(times) {
  while (--times >= 0) {
    await 0;
  }
}

function f() {
  return '123';
}

(async function main() {
  for (let i = 0; i < 2; ++i) {
    await waitTicks(1);
    console.log(await f());
  }
})();
