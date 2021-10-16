 function R(x) {
  return Promise.resolve(x);
}

async function main() {
  const p = R().then(f1)
    .then(sleep1s)
    .then(f2);
  await start();
  await Promise.all([
    R().then(g1).then(g2),
    R().then(h1).then(h2),
    p
  ]);
  await done();
}
main();





function sleep1s() {
  return sleep(1000);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function f1() { }
function f2() { }
function f3() { }
function f4() { }
function f5() { }

function g1() { }
function g2() { }
function g3() { }
function g4() { }
function g5() { }

function h1() { }
function h2() { }

function start() { }
function done() { return 42; }