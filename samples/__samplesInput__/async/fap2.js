
// async function g(x) {
//   await x;
// }

async function f(x) {
  await x;
}

async function main() {
  await f(1);
  await f(2);
  f(3);
  await f(4);
}

main();

/*
[Dbux Runtime] Add edge from run 1 to 2 type FORK
[Dbux Runtime] set run 2 thread id 1
[Dbux Runtime] Add edge from run 2 to 3 type FORK
[Dbux Runtime] set run 3 thread id 2
[Dbux Runtime] Add edge from run 3 to 4 type CHAIN
[Dbux Runtime] set run 4 thread id 2
[Dbux Runtime] Add edge from run 4 to 5 type CHAIN
[Dbux Runtime] set run 5 thread id 2
[Dbux Runtime] Add edge from run 5 to 6 type FORK
[Dbux Runtime] set run 6 thread id 3
[Dbux Runtime] Add edge from run 5 to 7 type CHAIN
[Dbux Runtime] set run 7 thread id 2
[Dbux Runtime] Add edge from run 7 to 8 type CHAIN
[Dbux Runtime] set run 8 thread id 2
*/