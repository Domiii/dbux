function rand(lo, hi) {
  return lo + Math.floor(Math.random() * (lo + hi))
}

// generate 10 objects
const n = 10;
const a = Array(n).fill({}).map((_, x) => ({
  x
}));

const counts = new Map();       // keep count

// draw! 抽獎！
for (let i = 0; i < 100; ++i) {
  const o = a[rand(0, n)];
  const count = counts.get(o);
  counts.set(o, count ? count + 1 : 1);
}

// winner!
const maxCount = Math.max(...counts.values());
const winner = Array.from(counts.entries()).
  find(([_, val]) => val === maxCount)[0];
console.log(winner.x, maxCount);