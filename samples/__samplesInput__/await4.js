async function af44() {
  const a = await f();
  const b = await f(1);
}

async function f(x) {
  return console.log(x), 4;
}

af44();