
for (var [{ aa } = { aa: 1000 }, b = 200] of [[, 2], [{ aa: 3 }]]) {
  console.log(aa, b);
}
