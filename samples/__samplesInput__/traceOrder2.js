//  * `throw await x;`
// * `return await x;`
// * `o[await x]`
// * -> problem: `awaitVisitor` and`returnVisitor` / `memberExoression visitor` at odds ?
//  * `f(a, await b, c)`
//   * -> probably won't work, because `resolveCallIds` would try to resolve results too fast