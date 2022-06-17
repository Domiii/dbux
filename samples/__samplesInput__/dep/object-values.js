
function main(o) {
  const a = Object.values(o);
  return [...a];
}

console.log(main({ x: 1, o: { y: 2} }));
