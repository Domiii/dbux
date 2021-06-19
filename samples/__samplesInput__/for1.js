let sum = 0;
identity();
for (var i = 1; i < 8; i += 2) {
  sum += i * i;
  console.log(sum);
  if (i < 4) {
    identity(sum);
  }
}


function identity(x) {
  return x;
}