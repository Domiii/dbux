function add2(a, i) {
  a[i] += a[i + 1];
  a[i + 1] += a[i + 2];
}


function main(a = [1, 2, 3, 4], b = 100) {
  add2(a, 0);
  add2(a, 1);

  a[2] *= b;

  return a;
}

main();
