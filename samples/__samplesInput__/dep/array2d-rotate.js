/**
 * @see https://leetcode.com/problems/rotate-image/discuss/1175496/JS-Python-Java-C%2B%2B-or-Easy-4-Way-Swap-Solution-w-Explanation
 */
function rotate(m) {
  let n = m.length, depth = ~~(n / 2)
  for (let i = 0; i < depth; i++) {
    let len = n - 2 * i - 1, opp = n - 1 - i
    for (let j = 0; j < len; j++) {
      let temp = m[i][i + j]
      m[i][i + j] = m[opp - j][i]
      m[opp - j][i] = m[opp][opp - j]
      m[opp][opp - j] = m[i + j][opp]
      m[i + j][opp] = temp
    }
  }
  return m;
}

// const m = [
//   [1, 2],
//   [4, 5]
// ];

const m = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];
rotate(m);

