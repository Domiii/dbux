function main(root) {
  const {
    left: {
      children: [a, b]
    },
    right
  } = root;
  return { a, b, right };
}

const root = {
  x: 1,
  left: { x: 2, children: ['a', 'b', 'c'] },
  right: { x: 3 }
};
console.log(main(root));
