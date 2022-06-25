function main(a, b, c, d, e) {
  if (true) {
    const arr = [];

    // arr.push(a);
    // arr.push(b);

    (() => {
      arr.push(c);
    })();

    arr.push(d);

    return arr;
  }
}

console.log(main(1, 2, 3, 4, 5, 6));
