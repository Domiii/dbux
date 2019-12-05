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
* source map does not resolve
  * properly sort out 3 versions of the code (not just 2!)
  * does webpack generate a conflicting sourcemap?
* trackObject is not ignored in webpack config
* fix `x.undefined` when replacing `MemberExpression`