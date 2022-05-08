const a = [1,2,3];
const j = 0;

[a[j], a[j + 1]] = [a[j + 1], a[j]];

console.log(a);
