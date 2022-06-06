function main(a) {
  
  a[0] = a[1];

  return a;
}

console.log(main([1, 2, 3]));
