/**
 * @file Destructuring assignment with initial value.
 */

function main(tmp) {
  const { 
    a = { x: 1 },
    b = 5
  } = tmp;

  return [a.x, b  + 1];
}

console.log(main({ }));

