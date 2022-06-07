function main(root) {
  const {
    left: {
      children: [a, b] }
  } = root;
  console.log(a);
  return [ a, b ];
}

const root = {
  x: 1,
  left: { x: 2, children: ['a', 'b', 'c'] },
  right: { x: 3 }
};
console.log(main(root));
