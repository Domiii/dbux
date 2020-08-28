function f(x) {
  return x;
}

function g(x) {
  console.log(x)
}

function h(x, y) {
  return x + y;
}


function main() {
  const x = 5;
  const y = 6;
  const z = 7;

  if (f(x)) {
    g(h(y, z));
  }
  
  return null;
}

main();