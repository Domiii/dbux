
async function f() { return 7122; }

async function g() {
  f();
  await f();
}

g();