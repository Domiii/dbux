* https://github.com/Domiii/dbux/compare/master...slicing
* https://github.com/Domiii/dbux/compare/master...async2

## List

* `preAwait` takes `awaitArgument`
  * dbux-babel-plugin/src/visitors/awaitVisitor.js
  * -> dbux-babel-plugin/src/instrumentation/builders/await.js
* CER has trace call `traceCall`
  * (slicing uses traceCallResult instead)
  *  dbux-babel-plugin/src/helpers/traceHelpers.js
*  `postAwait` takes new `awaitArgument`


