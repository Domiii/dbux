function f0() {
}

async function af1(a) {
  return Promise.resolve(a);
}

async function af2() {
  await af1(1);
  await af1(2);

  return 2 + await af1(3) - 3;
}

async function af33(delay) {
  return new Promise(r => {
    setTimeout(r.bind(33), delay);
  });
}

async function af44() {
  const a = await af33(100);
  const b = await af33(50);

  return a + b + af33(10);
}

(async function main() {
  console.log(
    await Promise.all([
      af2(),
      af44()
    ])
  );

  f0();
})();