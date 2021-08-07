async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function cb(x) {
  console.log('cb1', x);
  await 0;
  console.log('cb2', x);
  await 0;
  console.log('cb3', x);
}

(async function main() {
  const timer = setInterval(cb, 50);

  await sleep(200); // let timer run (roughly) 4 times

  clearInterval(timer);
})();