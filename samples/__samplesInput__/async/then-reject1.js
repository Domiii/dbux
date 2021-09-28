function f() {
  console.log('f1');
  return Promise.reject()
    .then(
      () => { },
      () => {
        console.error('f2 rejected');
      }
    )
    .then(() => 'f3');
}

(async function main() {
  await f();
})();
