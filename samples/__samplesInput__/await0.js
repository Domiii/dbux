async function sleep(ms) {
   return new Promise(r => setTimeout(() => r(13), ms)); 
  }

async function main() {
  console.log(1);
  await sleep(800);
  console.log(2);
  // await sleep(800);
  // console.log(3);
  // await sleep(800);
  // console.log(4);
  // await sleep(800);
  // console.log(5);
}

main();

// setTimeout(main, 100);
// setTimeout(main, 200);
// setTimeout(main, 300);
