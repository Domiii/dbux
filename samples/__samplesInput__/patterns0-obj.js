const a = { x: 1, y2: 2, y: 3 };

({ x, y2: y } = a);

console.log(x, y);
