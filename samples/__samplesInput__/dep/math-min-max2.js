// Math.min(
//   numbers[startIndex], // Jump is within array.
//   numbers.length - 1 - startIndex, // Jump goes beyond array.
// );

/**
 * @file
 */

function main(a, b) {
  const m = Math.min(a[0], b);
  return [m];
}

main([-1, 44], 333);
