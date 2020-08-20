function main() {
  function fibonacci(n) {
    return n < 1 ? 0
      : n <= 2 ? 1
        : fibonacci(n - 1) + fibonacci(n - 2);
  }

  fibonacci(10);
}

main();
