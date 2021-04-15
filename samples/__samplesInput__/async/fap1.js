

async function f() {
  "fa";
  await 0;
  "fb";
  await 0;
  "fc";
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

ex2();