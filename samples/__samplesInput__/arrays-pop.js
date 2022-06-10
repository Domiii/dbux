
function main(a) {
  const x = a.pop();
  // return a;
  return [x, ...a];
}

console.log(main([1, 2, 3, 4]));
