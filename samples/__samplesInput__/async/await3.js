async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function f1(g) { g(); return sleep(2000); }

async function f2() { await sleep(2000); }

async function f3() {
  await sleep(2000);
}

async function f4(...fs) {
  for (const f of fs) {
    await f();
    console.log('done:', f.name);
  }
}

// TODO: *VSCode bug* here - only displays one (not multiple) `traceDecoration` 
//    behind last argument of function call, if there is nothing following it on the same line
async function main() {
  await f1(
    f2
  );
  await f4(
    f2,
    sleep.bind(null, 2000),
    f3
  );
}

main();
