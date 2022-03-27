generator functions + virtual/real context changes

## code to check

* search:
  * EndOfContext

## definitions

* `all-types-of-interruptable-function`
  * generator
  * async
  * async generator

## test

0. `DataProviderUtil`
   * getChildrenOfContextInRoot
1. navigation
   * in/out/over inside of `all-types-of-interruptable-function`
2. errors
   * in normal, gen and async functions
3. CG
   * HoleNodes
     * root and non-root holes
   * Stats: context counting