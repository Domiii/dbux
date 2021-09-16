process.nextTick(f);


function f(n = 1e3) {
  process.nextTick(() => f(--n));
}
