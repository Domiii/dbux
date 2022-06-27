function main(a, x) {
  return [...a, x];
}

main([1, { x: 2 }, [{ y: 3 }]], 4);
