var sum = 0;
for (let i = 1; i < 5; i += 2) {
  sum += i*i;
  console.log(i);
  if (i === 1) {
    identity(sum);
  }
}


function identity(x) {
  return x;
}