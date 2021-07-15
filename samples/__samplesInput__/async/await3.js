async function sleepN(times) {
  while (--times >= 0) {
    await 0;
  }
}

(async function main() {
  await sleepN(2);
  await sleepN(2);
})();