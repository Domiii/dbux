

async function f() {
  console.log("fa");
  await 1;
  console.log("fb");
  await 2;
  console.log("fc");
}


async function ex1() {
  10;

  f();

  11;
}

async function ex2() {
  10;

  await f();

  11;
}

ex1();
ex2();

/*
[Dbux Runtime] Add edge from run 1 to 2 type FORK
[Dbux Runtime] set run 2 thread id 1
[Dbux Runtime] Add edge from run 2 to 3 type FORK
[Dbux Runtime] set run 3 thread id 2
[Dbux Runtime] Add edge from run 2 to 4 type CHAIN
[Dbux Runtime] set run 4 thread id 1
[Dbux Runtime] Add edge from run 3 to 5 type CHAIN
[Dbux Runtime] set run 5 thread id 2
[Dbux Runtime] Add edge from run 4 to 6 type FORK
[Dbux Runtime] set run 6 thread id 3
*/