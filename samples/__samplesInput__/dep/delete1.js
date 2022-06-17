
function main(a) {
  // a[4] = a[1];
  delete a[3];
  return a;
}

console.log(main([1, 2, 3, 4]));
