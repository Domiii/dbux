class A {
  x = 2;
}

function main(a) {
  a.x += 1;
  // const b = a.x;
  // a.y = b + 3;
  return a;
}

main(new A());

