/**
 * This happens in: `btPowerSet`
 * @file
 */

function main(a, b) {
  a.push([...b]);
  return a;
}

console.log(main([2], [4, 5]));
