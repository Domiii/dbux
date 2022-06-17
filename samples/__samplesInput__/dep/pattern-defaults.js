/**
 * @file Destructuring assignment with initial value.
 */

function main(tmp) {
  // const {
  //   a = { x: 1 },
  //   b = 5
  // } = tmp;
  let {
    a,
    b
  } = tmp;
  a ||= { x: 1 };
  b ||= 5
  return [a.x, b  + 2];

  // var b = 2;
  // return [b];
}

console.log(main({ y: 55 }));

