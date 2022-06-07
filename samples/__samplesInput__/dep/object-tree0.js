function main(root) {
  const a = [];
  a.push(root.x, root.left.x, root.right.x, ...root.left.children);
  return a;
}

const root = {
  x: 1,
  left: { x: 2, children: ['a', 'b', 'c'] },
  right: { x: 3 }
};
console.log(main(root));
