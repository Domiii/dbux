function main(m, a, b, o) {
  m.set(a, o);
  m.set(o, b);
  m.delete(b);
  m.set(3, a);

  return m;
}

main(new Map([[2, 1]]), 1, 2, { x: 3 });
