# Introduction

This is a pre-alpha project, aiming at making the JS runtime and its dynamic call graph visual and interactive through a combination of instrumentation (using Babel) + a VSCode extension, effectively (ultimately) making it an amazing tool for (i) program comprehension + (ii) debugging.

The `master` branch is not quite active yet. Check out the `dev` branch instead.

Here is a (very very early, read: crude) 1min demo video of just a small subset of the features:

<a href="https://www.youtube.com/watch?v=VAFcj75-vSs" target="_blank" alt="video">
   <img src="http://img.youtube.com/vi/VAFcj75-vSs/0.jpg">
</a>


# Development + Contributing: Getting Started

## Prerequisites

* node
* vscode
* yarn


## Setup

```sh
git clone https://github.com/Domiii/dbux.git
cd dbux
code .
npm run dbux-install

# if dependencies bug out, run the (very aggressive) clean-up command: `npm run dbux-uninstall`
```


## Start development

```sh
code . # open project in vscode
npm start # start webpack build of all projects in watch mode
```

## Usage

1. go to your debug tab, select `dbux-code` and press F5 (runs the vscode extension in debug mode)
1. Inside of the new window, you can:
   * `dbux-run # instruments + executes currently opened file`
   * test on one of the pre-configured projects
   * use `dbux-cli` to setup + run your own project

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
1. Run one of the notebooks, load the file, and analyze :)


## Test: Project 1

1. After you opened a new VSCode window with `dbux-code` enabled (see steps above), in that window you can run + trace all kinds of code.
1. Dbux currently has one frontend project pre-configured for testing purposes, that is [todomvc](http://todomvc.com/)'s `es6` version.
   * install it first: `npm run p1-install`
1. Run it: `npm run p1-start` (starts webpack + webpack-dev-server)
1. Open in browser (http://localhost:3030), then check results of the run in the extension test window


## Architectural Notes

This is a multi-project monorepo.

Why is it not using LERNA? Because I did not know about LERNA when I started; but it's working quite well nevertheless :)


# Some dependencies

## Basics

```sh
`# jest` yarn add --dev jest jest-expect-message jest-extended
`# babel basics` yarn add --dev @babel/core @babel/cli @babel/node @babel/register 
`# babel plugins` yarn add --dev @babel/preset-env @babel/plugin-proposal-class-properties @babel/plugin-proposal-optional-chaining @babel/plugin-proposal-decorators @babel/plugin-proposal-function-bind @babel/plugin-syntax-export-default-from @babel/plugin-syntax-dynamic-import @babel/plugin-transform-runtime && \
`# babel runtime` yarn add core-js@3 @babel/runtime
`# eslint` yarn add --dev eslint eslint-config-airbnb-base
`# webpack` yarn add --dev webpack webpack-cli webpack-dev-server nodemon
`# flow` yarn add --dev flow-bin @babel/preset-flow eslint-plugin-flowtype && npx flow init #&& npx flow
`# babel dev` yarn add --dev @babel/parser @babel/traverse @babel/types @babel/generator @babel/template @babel/code-frame babel-plugin-tester
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

# Some Notes on Implementation

(only very few of the features are explained here, a lot more to come in the future...)

## dbux-data
* Indexes
   * [shape] an index is a complete partitioning of all data of one particular collection
   * [storage method] all new data is categorized into all matching indexes
   * [storage invalidation] previously indexed data will generally never get evicted
   * [key type] (currently) keys of indices can only be numbers
      * TODO: add string keys as well, without reducing performance of number-based indices
   * [storage type] objects in indexes are always entries of `Collection`s
* Queries
   * [shape] usually we want Queries to be `CachedQueries` (currently all are) which perform an expensive computation and then store the result thereof
   * [storage method] only results of individual queries are cached when queried (not cached when data comes in)
   * [storage invalidation] cache will be invalidated when new data comes in (unless `cfg.versionDependencies` is empty)
   * [key type] the keys of cached query results are the input arguments ("`args`")
      * that's why `args` should ideally be a single primitive data type or a flat array of primitive data types
   * [storage type] queries can return and cache any data type




# Known Issues

* calling `process.exit` too early will leave you blind
   * `process.exit` kills the process, even if not all recorded data has been sent out yet
   * as a result, you won't see all traces/contexts etc.
   * if you *MUST* call it, make sure to put it in a `setTimeout` with 0.5-1s delay
   * NOTE: many frameworks that might kill your process allow disabling that (e.g. `Mocha`'s `--no-exit` argument)
* impure property getters can cause unwanted side effects
   * dbux tracks data in real-time, by reading variables, objects, arrays etc.
   * It also reads all (or at least many) properties of objects, thereby unwittingly causing side-effects that a pure observer should not cause.
   * e.g. `class A { count = 0; get x() { return ++this.count; } } // dbux will read x, and thus unwittingly change count`
   * TODO: how to prevent dbux from altering semantics of your program?
* What applications **won't** work so well with dbux?
   * Proxies and custom object getters with side effects
      * For serialization `dbux-runtime` iterates (or will in the future iterate) over object properties
      * Thus possibly causing side effects with proxy and getter functions
      * At least it will leave unwanted traces (while attempting to "observe") - Damn you, [Observer effect](https://en.wikipedia.org/wiki/Observer_effect_(physics))!!! :(
      * TODO: at least flag traces caused by `dbux-runtime` by setting some `trace-triggered-from-dbux-builtin-call` flag while running built-in functions
         * NOTE: This will still mess with proxy and getter functions that themselves have side effects, such as caching functions, tracers and more.
* Issues under Windows
   * **sometimes**, when running things in VSCode built-in terminal, it might change to lower-case drive letter
      * This causes a mixture of lower-case and upper-case drive letters to start appearing in `require` paths
         * => this makes `babel` unhappy ([github issue](https://github.com/webpack/webpack/issues/2815))
      * Official bug report: https://github.com/microsoft/vscode/issues/9448
      * Solution: run command in external `cmd` or find a better behaving terminal


# VSCode: Advanced Usage

## General Tips&Tricks
* https://vscodecandothat.com/
* https://medium.com/club-devbytes/how-to-use-v-s-code-like-a-pro-fb030dfc9a72
* 

## Use VSCode as git diff tool

* [see here](https://stackoverflow.com/a/47569315)

## Keyboard shortcuts

NOTE: VSCode's Terminal has no "Clear" keybinding anymore
You can re-add it manually:

1. CTRL+SHIFT+P -> "Open Keyboard Shortcuts (JSON)"
1. add (for Windows use `ctrl`; for MAC use `cmd`):
```js
{ 
   "key": "ctrl+k",
   "command": "workbench.action.terminal.clear",
   "when": "terminalFocus"
},
```

# Some of the more annoying problems that have already been resolved

* `Socket.IO` depends on `uws` which is deprecated
   * fix: tell webpack to ignore it, since by default its not being used
   * see: https://github.com/socketio/engine.io/issues/575
   * see: https://github.com/socketio/socket.io/issues/3342
   * see: https://github.com/mmdevries/uws
* `socket.io-client` bugs out because `ws` is bundled as targeting browser
   * `code-insiders .\dbux-runtime\node_modules\engine.io-client\lib\transports\websocket.js`
* Babel Config pain
   * [how to use Babel 7 babel-register to compile files outside of working directory #8321](https://github.com/babel/babel/issues/8321)
   * https://github.com/babel/babel/pull/5590


# Higher Order Questions

## Questions that we can already answer

* Which parts of my code executed?
* How often did this code execute?
* What did these expressions evaluate to during each execution?
* What were the arguments passed to this function call?
* Where did the execution go from here? Where did it come from?
* Which events were triggered and how did its handlers execute?

## TODO: Questions we want to work on next

* Sub-graph filtering
   * Search sub graph contexts by keyword (QuickInput)
   * All traces/contexts/runs that referenced some object (ValueRef)

## Future Work (even more cool questions)

* Sub-graph filtering
   * Multiple filter UI modes
      * hide vs. grayed out?
* What is the critical path in this sub-graph, in terms of call-stack depth?
   * NOTE: we don't aim to do performance analysis, so we can't find the *actual* critical path
* Given two traces, find shortest path (or path that is most likely to be the actual path?)
   * TODO: Somehow visualize and allow interactions with that path
      * -> Possibly like a car navigation system -> listing all the twists and turns in a list
* Interactive visualized call graph
   * zoom- and pan-able
   * multi-resolution
   * features and filters can be enabled and disabled
   * multiple coloring schemes (e.g. one each for color per file/context/feature type and more)11


# Features

## Data Recording + Data Processing Mechanisms

* Instrumentation
* Collection
* Postprocessing
   * adding one-to-one fields (pre-index)
   * Index
   * adding one-to-one fields (post-index)
* Query + CachedQuery

## Concept: Contexts + StaticContexts

## Concept: Traces + StaticTraces

## Data Flow

### Object Tracking

## Error Reporting


## Control Flow

### Basic Control Flow

### Callback Tracking

### Interruptable functions: async

### Interruptable functions: generator

### Error reporting

* Are dynamic vs. static exit traces of functions the same?
* special attention: `try` statements


## Call Graph Navigation

* {Previous,Next}InContext
   * Use `getTracesOfRealContext`
   * [no_trace]
      * [Previous && current trace is Push && previous trace is Pop]
         * -> go
      * [Next && current trace is Pop && next trace is Push]
         * -> go
* PreviousParent
   * First trace in current context --> context's `parentTraceId`
* NextParent
   * Same as `PreviousParent`, but get "next in context" of `parentTrace`
* PreviousChild
   * Use `ParentTracesInRealContextIndex`
* NextChild
   * Same as `PreviousChild`, but use "next in context" of `parentTrace`