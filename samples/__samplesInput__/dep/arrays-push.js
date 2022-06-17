const a = [1, 2];

// a.push(3);
// a.push(4);
a.push.apply(a, [5, 6]);

console.log(...a, a[2], a[3], a[5]);