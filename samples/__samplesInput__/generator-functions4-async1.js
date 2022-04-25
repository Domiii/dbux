async function* f(x) {
  yield x + 1;

  await 101;

  yield x + 2;

  await 102;

  yield x + 3;
  yield x + 4;

  await 103;
  await 104;

  yield x + 5;
  yield x + 6;

  return x + ' Done!';
}

(async function main() {
  const gen = f(10);

  console.log((await gen.next()).value);
  console.log((await gen.next()).value);
  console.log((await gen.next()).value);
  console.log((await gen.next()).value);
  console.log((await gen.next()).value);
  console.log((await gen.next()).value);
})();

