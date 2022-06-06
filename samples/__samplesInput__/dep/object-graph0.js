function main(root) {
  const a = [];
  a.push(root.x, root.left.x, root.right.x);
  return a;
}

console.log(main({ x: 1, left: { x: 2 }, right: { x: 3 } }));
