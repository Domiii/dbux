async function sleep(ms) {
   return new Promise(r => setTimeout(r, ms)); 
  }

async function main() {
  console.log(1);
  await sleep(3000);
  console.log(2);
  await sleep(3000);
  console.log(3);
  await sleep(3000);
  console.log(4);
  await sleep(3000);
  console.log(5);
}

setTimeout(main, 3000);
