
TODO: https://gist.github.com/PurpleBooth/b24679402957c63ec426
TODO: provide basic protocols

# Development + Contributing: Getting Started

## Prerequisites

* bash (e.g. via cygwin or `git` (which also installs cygwin) on Windows)
* node (we recommend [v12.12.0](https://nodejs.org/en/blog/release/v12.12.0/) or higher for its source map support)
* vscode
* yarn


## Setup

```sh
git clone https://github.com/Domiii/dbux.git
cd dbux
code dbux.code-workspace # open project in vscode
npm run dbux-install
```

if dependencies bug out, run the (very aggressive) clean-up command: `npm run dbux-reinstall`


## Start development

1. Open project + start webpack
   ```sh
   code dbux.code-workspace # open project in vscode
   npm start # start webpack development build of all projects in watch mode
   ```
1. Go to your debug tab, select the `dbux-code` configuration and press F5 (runs dbux-code (VSCode extension) in debug mode)
1. Inside of the new window, you can then use the development version of `dbux-code`

## Analyze with Python Notebooks

In the `analyze/` folder, you find several python notebooks that allow you analyze the data that `dbux` generates. Here is how you set that up:

1. Run some program with Dbux enabled (e.g. `samples/[...]/oop1.js`)
1. In the VSCode extension, open a file of that program that has traces in it
1. In VSCode `Run Command` (`CTRL/Command + SHIFT + P`) -> `Dbux: Export file`
1. Make sure you have Python + Jupyter setup
   * Windows
      * [Install `Anaconda` with `chocolatey`](https://chocolatey.org/packages/anaconda3)
      * Set your `%PYTHONPATH%` in system config to your Anaconda `Lib` + `DLLs` folders (e.g. `C:\tools\Anaconda3\Lib;C:\tools\Anaconda3\DLLs;`)
      * Done!
   * Other OSes
1. Run one of the notebooks, load the file, and analyze

# Some dependencies

## Basics

```sh
babelVersion=7.81
`# jest` yarn add --dev jest jest-expect-message jest-extended
`# babel basics` yarn add --dev @babel/core @babel/cli @babel/node @babel/register 
`# babel plugins` yarn add --dev \
@babel/compat-data@$babelVersion `# see https://stackoverflow.com/questions/60780664/could-not-find-plugin-proposal-numeric-separator` \
@babel/preset-env@$babelVersion \
@babel/plugin-proposal-class-properties@$babelVersion \
@babel/plugin-proposal-optional-chaining@$babelVersion \
@babel/plugin-proposal-decorators@$babelVersion \
@babel/plugin-proposal-function-bind@$babelVersion \
@babel/plugin-syntax-export-default-from@$babelVersion \
@babel/plugin-syntax-dynamic-import@$babelVersion \
@babel/plugin-transform-runtime@$babelVersion \
`# babel runtime` yarn add core-js@3 @babel/runtime@$babelVersion
`# eslint` yarn add --dev eslint eslint-config-airbnb-base
`# webpack` yarn add --dev webpack webpack-cli webpack-dev-server nodemon
`# babel dev` yarn add --dev \
@babel/parser@$babelVersion \
@babel/traverse@$babelVersion \
@babel/types@$babelVersion \
@babel/generator@$babelVersion
@babel/template@$babelVersion \
@babel/code-frame@$babelVersion \
babel-plugin-tester
```

or with npm:
```sh
`# jest` npm i -D jest jest-expect-message jest-extended
`# babel basics` npm i -D @babel/core @babel/cli @babel/node @babel/register 
`# babel plugins` npm i -D @babel/preset-env @babel/plugin-proposal-class-properties @babel/plugin-proposal-optional-chaining @babel/plugin-proposal-decorators @babel/plugin-proposal-function-bind @babel/plugin-syntax-export-default-from @babel/plugin-syntax-dynamic-import @babel/plugin-transform-runtime && \
`# babel runtime` npm i -S core-js@3 @babel/runtime
`# eslint` npm i -D eslint eslint-config-airbnb-base
```

## Upgrading Packages
```sh
`# babel` npm run dbux-install --force --save @babel/cli@latest @babel/core@latest @babel/node@latest @babel/plugin-proposal-class-properties@latest @babel/plugin-proposal-decorators@latest @babel/plugin-proposal-function-bind@latest @babel/plugin-proposal-optional-chaining@latest @babel/plugin-syntax-dynamic-import@latest @babel/plugin-syntax-export-default-from@latest @babel/plugin-syntax-flow@latest @babel/plugin-transform-runtime@latest @babel/preset-env@latest @babel/preset-flow@latest @babel/register@latest

`# babel instrumentation` @babel/code-frame@latest @babel/template@latest
```

## package.json magic
* replace: `"([^"]+)": "([^"]+)",\n\s*` w/ `$1@latest`


# References

## Analyzing source maps

* [This little tool](http://sokra.github.io/source-map-visualization/) allows us to investigate how our input + output files relate to one another. (NOTE: The author claims its just a hacked together toy, so maybe don't trust it too much.)

## Debugging Intermediate + Advanced
* Getting the debugger to work when it just won't work!
   * https://stackoverflow.com/a/53288608
* Tell debugger to skip files
   * Chrome: [Blackboxing](https://developer.chrome.com/devtools/docs/blackboxing)

## References: AI-supported coding
* [VS Intellicode](https://github.com/MicrosoftDocs/intellicode/blob/master/docs/intellicode-visual-studio-code.md)
* https://livablesoftware.com/smart-intelligent-ide-programming/

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

## References: npm
* [NPM links don't work quite right](https://medium.com/@UD_UD/finally-npm-install-and-npm-link-walks-hand-in-hand-79f7fb6fc258)


## Reference: Istanbul + NYC
Istanbul + NYC add require hooks to instrument any loaded file on the fly
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
