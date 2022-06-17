
function rotate(m) {
  m[0][1] = m[1][0];
  return m;
}

const m = [
  [1, 2],
  [4, 5]
];
rotate(m);
