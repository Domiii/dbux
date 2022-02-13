async function sleep(ms) { 
  return new Promise(r => setTimeout(r, ms));
}

function cb() {
  console.log('cb!');
}

(async function main() {
  const timer = setInterval(cb, 50);

  await sleep(50);
  await sleep(50);

  // let timer run a few more times
  await sleep(200);

  clearInterval(timer);
})();