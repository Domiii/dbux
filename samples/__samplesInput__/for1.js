let sum = 0;
for (var j = 1; j < 4; j += 2) {
  console.log(j, sum += j);
}

for (let i = 1; i < 4; i += 2) {
  console.log(i, sum += i);
}
