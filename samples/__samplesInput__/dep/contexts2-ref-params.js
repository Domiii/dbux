function add(a) {
  return a[0] + a[1];
}

function main(a) {
  var c = add(a);

  return [c, a[0]];
}

main([1, 2]);
