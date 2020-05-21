async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log(1);
  await sleep(5000);
  console.log(2);
  await sleep(5000);
  console.log(3);
}

main();


// TODO:
// all kinds of complex `await` combinations
//  * `throw await x;`
// * `return await x;`
// * `o[await x]`
// * `o[await x](x)`
// * `await o[await x](x)`
// * -> problem: `awaitVisitor` and`returnVisitor` / `memberExoression visitor` at odds ?
//  * `f(a, await b, c)`
//   * -> probably won't work, because `resolveCallIds` would try to resolve results too fast