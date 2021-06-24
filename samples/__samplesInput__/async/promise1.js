
async function main() {
  10;
  await (new Promise(r => {
    setTimeout(() => r(17), 1000);
  }));
  11;
}

main();