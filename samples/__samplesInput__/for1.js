let sum = 0;
debugger;
identity();
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