async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log(1);
  await sleep(1500);
  console.log(2);
  await sleep(1500);
  console.log(3);
}

main();
