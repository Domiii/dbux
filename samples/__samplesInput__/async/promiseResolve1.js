async function f() {
  const aa = await 0;
  const a = await new Promise((resolve) => Promise.resolve().then(() => resolve(123)));
  console.log('f', aa, a, a === 123);
}

f();
