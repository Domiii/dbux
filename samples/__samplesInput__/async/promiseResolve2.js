let resolve;

async function f() {
  console.log('f1');
  await 0;
  console.log('f2');
  const a = await new Promise((r) => (resolve = r, setTimeout(g)));
  console.log('f3', a, a === 123);
}

function g() {
  resolve(123);
}

f();
