async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async function main() {
  await sleep(50);
})();