// async function sleep(ms) {
//    return new Promise(r => setTimeout(r, ms)); 
//   }

async function main() {
  console.log(1);
  await 0;
  console.log(2);
  await 0;
  console.log(3);
}

main();

// setTimeout(main, 100);
// setTimeout(main, 200);
// setTimeout(main, 300);
