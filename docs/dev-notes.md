
# Documentation

## Image conversion

* Sometimes, in order to produce proper documentation, image conversion is needed, especially to convert icon `svg`s to `png`s
* Mac
  * With imagemick (pre-installed on mac), you can do [this](https://stackoverflow.com/questions/9530524/convert-svg-to-transparent-png-with-antialiasing-using-imagemagick):
     * `convert -channel rgba -background "rgba(0,0,0,0)" in.svg out.png`


# References

## Some Tools

* When working on instrumentation, [astexplorer.net](https://astexplorer.net/) is worth gold.
* [This little tool](http://sokra.github.io/source-map-visualization/) can help investigate how input + output files relate to one another. (NOTE: The author claims its just a hacked together toy, so maybe don't trust it too much.)
* 

## Debugging Intermediate + Advanced

* Tell debugger to skip files
   * Chrome: [Blackboxing](https://developer.chrome.com/devtools/docs/blackboxing)

## References: babel + babel plugins

* [babel plugin handbook](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md)
* [babel parser docs](https://babeljs.io/docs/en/next/babel-parser.html)
* [babel-parser AST explorer](https://astexplorer.net/)
* [babel-types src (core)](https://github.com/babel/babel/blob/master/packages/babel-types/src/definitions/core.js)
* [babel parser AST specs](https://github.com/babel/babel/blob/master/packages/babel-parser/ast/spec.md)
* [babel traverse src](https://github.com/babel/babel/tree/master/packages/babel-traverse/src/path)
   * [NodePath:modification](https://github.com/babel/babel/blob/master/packages/babel-traverse/src/path/modification.js)
   * At its core: [path.visit()](https://github.com/babel/babel/blob/f544753bb8c9c7a470d98e897b089fd31b83d1f6/packages/babel-traverse/src/path/context.js#L59) and [path._call()](https://github.com/babel/babel/blob/f544753bb8c9c7a470d98e897b089fd31b83d1f6/packages/babel-traverse/src/path/context.js#L31)
   * [path.get](https://github.com/babel/babel/blob/master/packages/babel-traverse/src/path/family.js#L157)
      * [NodePath.get](https://github.com/babel/babel/blob/master/packages/babel-traverse/src/path/index.js#L71)
   * [generateUidBasedOnNode](https://github.com/babel/babel/tree/master/packages/babel-traverse/src/scope/index.js#L268)
   * NOTE: babel/traverse is not properly documented, so we go to the source
* [Problem: babel plugin ordering](https://jamie.build/babel-plugin-ordering.html)
   * [SO: explanation + example](https://stackoverflow.com/questions/52870522/whats-the-difference-between-visitor-program-enter-and-pre-in-a-babel-p/59211068#59211068)
* [babel-preset-env](https://github.com/babel/babel/blob/master/packages/babel-preset-env/src/index.js)


## References: babel transpiler implementation details

* `#__PURE__`
   * [Pure annotation in downlevel emits](https://github.com/babel/babel/issues/5632)
   * [babel-helper/annotate-as-pure](https://babeljs.io/docs/en/next/babel-helper-annotate-as-pure.html)
   * [Exlplanation (UglifyJs)](https://github.com/mishoo/UglifyJS2/commit/1e51586996ae4fdac68a8ea597c20ab170809c43)


## Reference: Instrumentation in Istanbul + NYC

Istanbul is doing things similar to Dbux, in that it instruments the runtime of executed JS programs. That is why it is certainly worth studying.

Istanbul + NYC add require hooks to instrument any loaded file on the fly.

* NOTES: How does it work?
   * They are using `require.extensions` (which are deprecated)
   * More info here: [https://gist.github.com/jamestalmage/df922691475cff66c7e6](Breakdown of How Require Extensions Work)
* References: Instrumentation
   * https://github.com/istanbuljs/nyc/blob/master/lib/instrumenters/istanbul.js#L20
   * https://github.com/istanbuljs/istanbuljs/blob/master/packages/istanbul-lib-instrument/src/instrumenter.js#L50
      * https://github.com/istanbuljs/istanbuljs/tree/master/packages/istanbul-lib-instrument
      * [Istanbul visitor](https://github.com/istanbuljs/istanbuljs/blob/master/packages/istanbul-lib-instrument/src/visitor.js#L488) (babel plugin)
         * [counter statement generator](https://github.com/istanbuljs/istanbuljs/blob/master/packages/istanbul-lib-instrument/src/visitor.js#L164) (e.g. `__cov().branches[123]++`)
         * [visitor bookkeeping](https://github.com/istanbuljs/istanbuljs/tree/master/packages/istanbul-lib-instrument/src/source-coverage.js#L37)
   * [API](https://github.com/istanbuljs/istanbuljs/blob/master/packages/istanbul-lib-instrument/api.md)
* References: `require` hook
   * https://github.com/istanbuljs/nyc/blob/master/bin/nyc.js
   * https://github.com/istanbuljs/istanbuljs/blob/master/packages/istanbul-lib-hook/lib/hook.js
   * https://github.com/istanbuljs/append-transform
   * https://github.com/istanbuljs/append-transform/blob/master/index.js#L49
* Sourcemap problems
   * sourcemaps don't work right with NYC if `@babel/register` is not used
      * https://github.com/istanbuljs/nyc/issues/619
         * "This issue is blocked by [evanw/node-source-map-support#239](https://github.com/evanw/node-source-map-support/issues/239). The issue is that nyc source-maps are inline but [node-source-map-support](https://github.com/evanw/node-source-map-support) does not look at inline source-maps by default."
   * babel does not support proper sourcemap merging yet
      * https://github.com/babel/babel/issues/5408
      * https://github.com/facebook/metro/issues/104
      * https://github.com/babel/babel/blob/fced5cea430cc00e916876b663a8d2a84a5dad1f/packages/babel-core/src/transformation/file/merge-map.js
* Configuring Babel for NYC + Istanbul
   * One way they use it is `@babel/register`: https://babeljs.io/docs/en/babel-register
   * https://github.com/istanbuljs/istanbuljs/tree/master/packages/nyc-config-babel
      * https://github.com/istanbuljs/istanbuljs/tree/master/packages/nyc-config-babel
* More references
   * https://github.com/tapjs/foreground-child#readme
   * https://glebbahmutov.com/blog/preloading-node-module/
      * https://glebbahmutov.com/blog/turning-code-coverage-into-live-stream/

## References: VSCode extensions

* [Gitlens](https://github.com/eamodio/vscode-gitlens/tree/master/src) provides custom widgets with clickable buttons that pop up on hover
* adding custom queries/filters to treeview through configuration
   * https://github.com/microsoft/vscode-pull-request-github
* how to let WebView control VSCode `window` and vice versa:
   * [send message from webview](https://github.com/microsoft/vscode-extension-samples/blob/master/webview-sample/media/main.js#22)
   * [receive message in vscode](https://github.com/microsoft/vscode-extension-samples/blob/master/webview-sample/src/extension.ts#L106)
* idea to navigate between or control traces in code: [Jumpy](https://marketplace.visualstudio.com/items?itemName=wmaurer.vscode-jumpy)?
* idea to provide inline context menus: [`registerCompletionItemProvider`](https://code.visualstudio.com/api/references/vscode-api#2612)?
   * e.g.: https://marketplace.visualstudio.com/items?itemName=AndersEAndersen.html-class-suggestions
      * https://github.com/andersea/HTMLClassSuggestionsVSCode/blob/master/src/extension.ts
* cannot currently set `TreeItem` text color
   * Limited capability for some file names: https://github.com/microsoft/vscode/issues/47502#issuecomment-407394409
   * Suggested API discussion: https://github.com/microsoft/vscode/issues/54938


# Unsorted notes

## package.json magic
* replace: `"([^"]+)": "([^"]+)",\n\s*` w/ `$1@latest`