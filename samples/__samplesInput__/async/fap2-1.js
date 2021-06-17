

async function h(x) {
  // h1;
  await x;
  // h2;
}


async function main() {
  h(3);
}

main();

/*
7 runs,
2 forks and 4 chains
*/