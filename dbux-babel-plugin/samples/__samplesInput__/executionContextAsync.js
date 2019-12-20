async function af1() {
  return Promise.resolve(1);
}

async function af2() {
  await af1();
  await af1();

  return 2 + await af1();
}

async function af33(delay) {
  return new Promise(r => {
    setTimeout(r.bind(33), delay);
  });
}

async function af44() {
  const a = await af33(100);
  const b = await af33(50);

  return a+b + af33(10);
}

(async function main() {
  return Promise.all([
    af2(),
    af44()
  ]);
})();