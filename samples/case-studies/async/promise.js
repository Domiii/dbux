const p = Promise.resolve();

p.then(f).then(f).then(f);

function f() {
  return sleep(100);
}

function sleep(ms) {
  return new Promise(r => {
    setTimeout(r, ms);
  });
}