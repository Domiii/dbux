# dbux README

## TODO (dbux-code + dbux-data only)
* rename `dbuxWindow` to `dbuxContextView` (since it is a vertical tab containing only the context `treeView`)
* add a search bar to `ContextTreeView` (search by name)
   * if we cannot add a text `input` box, we can add a `button` + [`QuickInput`](https://code.visualstudio.com/api/references/vscode-api#InputBox)
   * when entering search terms, only display matching nodes
   * keep all necessary parent nodes
      * gray out any parent node that does not match the search (semi-transparent?)
   * (when clearing search, stay on selected node)
   * clear search on `Esc` key press
* add a button to toggle (show/hide) all intrusive features to the top of our `dbux window`
   * includes: `codeDeco`, `playback` buttons
   * add a keyboard shortcut (e.g. tripple combo `CTRL+D CTRL+X CTRL+C` (need every single key))
* add new index: `TracesByProgramContext`
   * NOTE: this index groups by `Context`, not by `StaticContext`!
   * group traces by most recent program context
   * these traces are grouped by `contextId` of an **ancestor** `Context` that is the **most recent** context of type `Program`
   * NOTE: when the same program is executed a second time, traces will be put into a different group
* in `ContextTreeView`, make text of all nodes that do not belong to the current `Program` semi-transparent
   * NOTE: use `TracesByProgramContext` index
* show a warning at the top of a file if it has been edited after the time of it's most recent `Program` `Context`
   * (if that's possible?)
   * (also in `codeDeco`)
* add a WebView below the `dbuxContextView` (name: `dbuxWebView` 之類的)
   * experiment: add an HTML `<button>` to the WebView that can execute a `command`
* add a `TracesByStaticTraceIndex`
* [codeDeco] identify any `trace` at position `i` of `context` `c1` is followed by `trace` at `i+1` who belongs to `context` `c2` and `c2` is a child of `c1`, give it a special `marker` (currently our markers are `|`)
   * for the marker icon, maybe some kind of arrow indicating "it goes a level deeper" would be good
   * since this is fast to lookup, we can just use a `util` function to determine the circumstance
   * however, we probably want a `ContextsByParentContextIndex` for this (which gives us all children of a given context)
   * if multiple `traces` are logged for the same `staticTrace`, only show the most recent one
* [codeDeco] if a `trace` is of type `ExpressionResult` and `value !== undefined`:
   * display the `value` in `codeDeco` behind the expression
   * if multiple `traces` are logged for the same `staticTrace`, only show the most recent one
* [treeView] add `Application` nodes to `treeView`
   * add `ContextsByApplicationIndex`
   * if more than one `Application` available:
      * all root nodes correspond to all `Application` entries
      * order: newest first
   * if only one `Application` available:
      * don't make it a root node (as that takes up unnecessary space)


## TODO (other)
* fix `dbux-data` and `dbux-runtime` to not bug out when multiple `Applications` send (possibly conflicting) data
   * (or the same applicaiton was restarted etc...)
   * add a new collection type `applications` that allows us to track which code belongs to which
      * possibly identify by directory + start time?
      * also requires making significant changes to `dbux-data`'s `DataProvider` and `indexes`
* instrumentation
   * fix: trace `displayName` should not contain comments
      * see: https://github.com/babel/babel/blob/master/packages/babel-traverse/src/path/index.js#L156

* more instrumentation
   * better name/typify `trace` entries
      * e.g. identify `catch` blocks (and more strategies)
* fix: in `dbuxState.add{Resume,Static}Context`, we set `_parentId` and `parent` but do not properly lookup global id later
* fix: `await0` sample doesn't work?
* fix: `DataProvider.clear` will cause problems down the line, when new incoming traces reference old (removed) contexts


## Implemented Features

*


## Fancy ideas (Dev)
* add extra-watch-webpack-plugin https://github.com/pigcan/extra-watch-webpack-plugin?

# Installing the good stuff

## Basics

```sh
`# jest` yarn add --dev jest jest-expect-message jest-extended
`# babel basics` yarn add --dev @babel/core @babel/cli @babel/node @babel/register 
`# babel plugins` yarn add --dev @babel/preset-env @babel/plugin-proposal-class-properties @babel/plugin-proposal-optional-chaining @babel/plugin-proposal-decorators @babel/plugin-proposal-function-bind @babel/plugin-syntax-export-default-from @babel/plugin-syntax-dynamic-import @babel/plugin-transform-runtime && \
`# babel runtime` yarn add core-js@3 @babel/runtime
`# eslint` yarn add --dev eslint eslint-config-esnext
`# flow` yarn add --dev flow-bin @babel/preset-flow eslint-plugin-flowtype && npx flow init #&& npx flow
`# babel dev` yarn add --dev @babel/parser @babel/traverse @babel/types @babel/generator @babel/template @babel/code-frame babel-plugin-tester && \
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


# Projects

## todomvc (vanilla-es6)

* `npm run p1-install`
* `npm run p1-start (starts web server)`
* (open in browser: http://localhost:3030)
   * (or: in VSCode go to debug menu and run "chrome todomvc" to enable debugging the runtime in VSCode)

# Implementation

## dbux-babel-plugin
* Instrumentation
   * try/finally
   * top level extraction
* Babel plugins:
   * https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/user-handbook.md
   * https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md
   * [`bael-plugin-tester`](https://github.com/babel-utils/babel-plugin-tester#examples)
* Babel Config pain
   * [how to use Babel 7 babel-register to compile files outside of working directory #8321](https://github.com/babel/babel/issues/8321)
   * https://github.com/babel/babel/pull/5590

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


# Projects



# Known Issues

* Windows only
   * When running things in VSCode built-in terminal, it sometimes changes to lower-case drive letter
      * Causing lower-case and upper-case drive letters to start appearing in `require` paths
         * => which makes `babel` unhappy ([github issue](https://github.com/webpack/webpack/issues/2815))
      * Official bug report: https://github.com/microsoft/vscode/issues/9448
      * Solution: run command in external `cmd` or find a better behaving terminal


# VSCode: custom keybindings

## VSCode's Terminal has no "clear" keybinding anymore

You can re-add it manually:

1. CTRL+SHIFT+P -> "Open Keyboard Shortcuts (JSON)"
1. add (for Windows):
```js
{ 
   "key": "ctrl+k",
   "command": "workbench.action.terminal.clear",
   "when": "terminalFocus"
},
```

# Some problems that have been worked through

* `Socket.IO` does not work anymore because it depends on a deprecated package
   * see: https://github.com/socketio/engine.io/issues/575
   * see: https://github.com/socketio/socket.io/issues/3342
   * see: https://github.com/mmdevries/uws


# Useful Snippets

```
	"Comment Barrier 1": {
		"scope": "javascript, typescript",
		"prefix": "comment-barrier1",
		"body": [
			"// ###########################################################################",
			"// $1",
			"// ###########################################################################$0"
		]
	},
	"Comment Barrier 2": {
		"scope": "javascript, typescript",
		"prefix": "comment-barrier2",
		"body": [
			"// ########################################",
			"// $1",
			"// ########################################$0"
		]
	}
```