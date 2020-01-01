async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function f1() {
  return sleep(50);
}

async function f2() {
  await sleep(50);
}

(async function main() {
  await Promise.all([
    f1(),
    f2()
  ]);
})();