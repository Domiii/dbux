
function main(a, b) {
  a.push(b);

  const result = {};
  let tmp;
  if (true) {

    tmp = a[a.length - 1];
    result.x = tmp;
    tmp = a.pop();
    result.y = tmp;
  }

  return result;
}

console.log(main([], { x: 1 }));
