let resolve;
async function f() {
  await new Promise(r => resolve = r);
  await 1;
}
async function g() {
  await 0;
  await 1;
  resolve();
}
f(); g();