# Dbux Instrumentation Notes

* How to see raw Dbux instrumented code?
  * Hit the "Run with Dbux" button
  * change `run` to `i`
  * run again
  * -> see complete Dbux-instrumented code
* terminology
  * path = Babel's wrapper around an AST `Node`
  * state = global state object
* more info
  * investigate original JS AST: https://astexplorer.net/
  * AST node types: https://babeljs.io/docs/en/babel-types
  * babel traverse (`path` etc): https://github.com/babel/babel/tree/master/packages/babel-traverse
* If you need more help, ask Domi. We probably have a helper function, examples or tool recommendations for most cases.