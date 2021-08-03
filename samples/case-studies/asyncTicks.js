async function countAwaitTicks(n = 6) {
  N = n;
  do {
    await new Promise(r => r());
    console.debug('await      tick', N - n + 1);
  } while (--n);
  console.debug('Tick counter ended.');
}
// countAwaitTicks();