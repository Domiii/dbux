function main() {
  function fibonacci(n) {
    return n < 1 ? 0
      : n <= 2 ? 1
        : fibonacci(n - 1) + fibonacci(n - 2);
  }

  log(fibonacci(6));
}

function log(...msgs) { console.log(...msgs); }

main();
