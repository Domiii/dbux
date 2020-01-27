let _ms;
function f1(r) {
  setTimeout(r, _ms)
}

async function sleep(ms) {
  // return new Promise(r => setTimeout(r, ms));
  _ms = ms;
  return new Promise(f1);
}

(async function main() {
  await sleep(50);
})();
