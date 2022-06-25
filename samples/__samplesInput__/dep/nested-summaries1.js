function main(a, b, c, d, e) {
  if (true) {
    const arr = [];

    const a2 = a;

    arr.push(a2, b);

    (() => {
      arr.push(c);
    })();

    arr.push(d);

    return arr;
  }
}

console.log(main(1, 2, 3, 4, 5, 6));
