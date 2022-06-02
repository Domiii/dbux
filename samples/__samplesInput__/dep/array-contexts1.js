function add2(a, i) {
  a[i] += a[i+1];
}


function main(a = [1, 2, 3], b = 100) {
  add2(a, 0);
  add2(a, 1);

  a[2] *= b;

  return a;
}

main();
