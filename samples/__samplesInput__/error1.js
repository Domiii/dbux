function f() {
  console.log('f1');
  throw new Error('ouch!');
  console.log('f2');
}

function main() {
  console.log('main1');
  f();
  console.log('main2');
}

main();