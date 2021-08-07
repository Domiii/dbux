async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function cb() {
  console.log('cb!');
}

(async function main() {
  const timer = setInterval(cb, 50);

  await sleep(200); // let timer run roughly 4 times

  clearInterval(timer);
})();