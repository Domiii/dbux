const q = [];
function notify(queue) {
  const next = queue.shift();
  if (next) { next(); }
}
function wait(queue) {
  return new Promise(r => queue.push(r));
}
async function f() {
  await 0;
  await wait(q);
  await 1;
}
async function g(n) {
  if (--n) { await g(n); }
  await 0;
  await 1;
  await 'notify';
  notify(q);
}
f(); f(); f(); g(3);