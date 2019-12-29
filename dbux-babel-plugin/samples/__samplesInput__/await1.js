async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function f1() {
  return sleep(50);
}

async function f2() {
  await sleep(50);
}

async function f3() {
  await sleep(200);
}

async function f4(...args) {
  await Promise.all(...args);
}

(async function main() {
  await f1();
  await f4(f2, f3, sleep.bind(null, 400));
})();