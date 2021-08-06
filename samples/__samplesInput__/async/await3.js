async function waitTicks(times) {
  while (--times >= 0) {
    await 0;
  }
}

(async function main() {
  await waitTicks(2);
  await waitTicks(2);
})();