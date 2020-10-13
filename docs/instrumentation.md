
# Dbux Instrumentation Notes

* How to see raw Dbux instrumented code?
  * Play -> change `run` to `i` -> run again -> see complete Dbux-instrumented code
* Debugging mode
  * `Verbose = true` in `traceVisitors`
* terminology
  * path = wrapper for node
  * state = global state object
* helpers
  * function traceWrapExpression(traceType, path, state, tracePath, markVisited = true)
    * traceType: see TraceType.js
    * path...
    * state...
    * tracePath
* more info
  * investigate original JS AST: https://astexplorer.net/
  * code generators: https://babeljs.io/docs/en/babel-types
  * babel traverse (`path` etc): https://github.com/babel/babel/tree/master/packages/babel-traverse
    * If you need help here, ask Domi first. We probably have a helper function or examples for that.


## Example: Tracing parameters

```
function f(a, b) {
}
```
->
```
function f(a, b) {
  traceExpr(a)
  traceExpr(b)
}
```
* `functionVisitor:150+`
* use `traceWrapExpression`
  * `path = parameter's id path` (each entry of `paramIds`)
  * `traceType = TraceType.ExpressionValue`
  * `tracePath =` probably same as `path`