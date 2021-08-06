async function waitTicks(times) {
  while (--times >= 0) {
    await 0;
  }
}

(async function main() {
  for (let i = 0; i < 2; ++i) {
    await waitTicks(1);
  }
})();
