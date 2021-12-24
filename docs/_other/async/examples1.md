## Example 1

In the following scenario, at the end of `main`...
* We have 3 pending stacks, halted during execution of:
  * `f()`
  * `h(1)`
  * `h(2)`
* `main` and `g` have already been popped.

```js
function main() {
  mainA;
  f();
  mainB;
}

async function f() {
  fA;
  g();
  await p();
  fB;
}

function g() {
  gA;
  h(1);
  h(2);
  gB;
}

async function h(x) {
  hA(x);
  await p(x);
  hB(x);
}


main();
```