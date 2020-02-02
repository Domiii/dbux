async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function f1() { return sleep(2000); }

async function f2() { await sleep(2000); }

async function f3() { await sleep(2000); }

async function f4(...fs) {
  for (const f of fs) {
    await f();
    console.log('done!', f.name);
  }
}

async function main() {
  await f1();
  await f4(f2, f3, sleep.bind(null, 1000));
}

main();
