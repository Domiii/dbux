var sum = 0;
for (let i = 1; i < 8; i += 2) {
  sum += i * i;
  console.log(sum);
  if (i < 4) {
    identity(sum);
  }
}


function identity(x) {
  return x;
}