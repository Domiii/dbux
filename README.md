# dbux README

## Major Components
* Babel
   * `npm i -D babel-cli babel-node babel-core babylon babel-traverse babel-types babel-generator babel-template babel-plugin-transform-runtime jest babel-plugin-tester && npm i -S babel-runtime babel-polyfill`
   * https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/user-handbook.md
   * https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md
   * [`bael-plugin-tester`](https://github.com/babel-utils/babel-plugin-tester#examples)

## Debugging Intermediate + Advanced
* 
* Tell debugger to skip files
   * Chrome: [Blackboxing](https://developer.chrome.com/devtools/docs/blackboxing)

## TODO
* Figure out best ways for plugin global code injections
   * running a plugin against multiple files?
   * @babel/runtime?
   * How does Istanbul do it? https://github.com/istanbuljs/istanbuljs/blob/master/packages/istanbul-lib-instrument/src/instrumenter.js


## References: babel + babel plugins

* [babel parser docs](https://babeljs.io/docs/en/next/babel-parser.html)
* [babel-types src (core)](https://github.com/babel/babel/blob/master/packages/babel-types/src/definitions/core.js)
* [babel parser AST specs](https://github.com/babel/babel/blob/master/packages/babel-parser/ast/spec.md)
* [babel traverse src](https://github.com/babel/babel/tree/master/packages/babel-traverse/src/path)
   * [NodePath:modification](https://github.com/babel/babel/blob/master/packages/babel-traverse/src/path/modification.js)
   * NOTE: babel/traverse 
   * NOTE: babel/traverse is not properly documented
* [Problem: babel plugin ordering](https://jamie.build/babel-plugin-ordering.html)
   * [SO: explanation + example](https://stackoverflow.com/questions/52870522/whats-the-difference-between-visitor-program-enter-and-pre-in-a-babel-p/59211068#59211068)
* [babel-preset-env](https://github.com/babel/babel/blob/master/packages/babel-preset-env/src/index.js)

## References: babel transpiler implementation details

* `#__PURE__`
   * [Pure annotation in downlevel emits](https://github.com/babel/babel/issues/5632)
   * [babel-helper/annotate-as-pure](https://babeljs.io/docs/en/next/babel-helper-annotate-as-pure.html)
   * [Exlplanation (UglifyJs)](https://github.com/mishoo/UglifyJS2/commit/1e51586996ae4fdac68a8ea597c20ab170809c43)