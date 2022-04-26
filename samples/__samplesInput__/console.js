/**
 * @file console in different places to test `GlobalConsoleNode`
 */

console.log('A');

log('B');

console.log('C')

function log(msg) {
  console.log(`${msg}`);
}