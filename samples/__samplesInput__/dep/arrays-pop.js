
function main(a, b) {
  a.push(b);
  const x = a.pop();
  const y = a.pop();
  const z = a.pop();
  // return a;
  return [x, y, z];
}

console.log(main([1, 2, 3, 4], 44));
