# dbux README

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
   
## Test: Project 1

1. After you opened a new VSCode window with `dbux-code` enabled (see steps above), in that window you can run + trace all kinds of code.
1. Dbux currently has one frontend project pre-configured for testing purposes, that is [todomvc](http://todomvc.com/)'s `es6` version.
   * install it first: `npm run p1-install`
1. Run it: `npm run p1-start` (starts webpack + webpack-dev-server)
1. Open in browser (http://localhost:3030), then check results of the run in the extension test window


## Architectural Notes

This is a multi-project monorepo.

Why is it not using LERNA? Because I did not know about LERNA when I started; but it's working quite well nevertheless :)


# TODO

## TODO (dbux-code + dbux-data; high priority)
* [callstackView]
   * when clicking a node:
      * highlight selected trace in tree (currently we highlight selected trace by adding the `play.svg` icon, see `traceDetailsView`)
   * do not change selected trace in `callstackView`
      * only update selected trace in `callstackView`, if triggered from anywhere but here
   * if context has both `parentId` and `schedulerTrace`:
      * add a button to the node to allow switching between `parent` and `scheduler`
* [applicationList] add a new TreeView (name: `dbuxApplicationList`) below the `dbuxContentView`
   * shows all applications in `allApplications`
   * lets you switch between them by clicking on them (can use `allApplications.setSelectedApplication`)
   * allows you to remove applications...
      * individually
      * "all old versions" (applications that have already been executed again)
      * "all selected"
   * add a checkbox (button) to select "automatically discard older application when executing again"
* [selectedContextView]
   * NOTE: a treeView that lets you better understand a partial `execution tree` in the context of the selected trace
   * Nodes:
      * all child `loop`s + `context`s in order
      * add one node for current trace to show where it is between the other calls
      * group child `contexts` into a new intermediate node, if they all originate from the same `trace`
         * (e.g. `find`, `map`, `forEach`, `reduce` and many more)
* [configuration + settings]
   * automatically store `BaseTreeViewNodeProvider.idsCollapsibleState` so it won't reset when re-opening
* [UI_design]
   * good icons + symbols in all tree nodes

## TODO (dbux-code + dbux-data; lower priority)
* add a search bar to `dbuxContextView` (search by `displayName` or `filePath`)
   * if we cannot add a text `input` box, we can add a `button` + [`QuickInput`](https://code.visualstudio.com/api/references/vscode-api#InputBox)
   * when entering search terms, only display matching nodes
   * keep all necessary parent nodes
      * NOTE: Cannot currently change VSCode `TreeItem` text color
      * (gray out any parent node that does not match the search (semi-transparent?))
   * (when clearing search, stay on selected node)
   * clear search on `Esc` key press
* add a button to the top right to toggle (show/hide) all intrusive features
   * includes:
      * hide `codeDeco`
      * hide any extra buttons (currently: playback buttons) in the top right
   * add a keyboard shortcut (e.g. tripple combo `CTRL+D CTRL+B CTRL+X` (need every single key))
* display a warning at the top of EditorWindow:
   * if it has been edited after the time of it's most recent `Program` `Context`
      * see: `window.showInformationMessage` and `window.showWarningMessage` ([here](https://code.visualstudio.com/api/references/vscode-api#window.showWarningMessage); [result screen](https://kimcodesblog.files.wordpress.com/2018/01/vscode-extension1.png))
      * offer buttons to...:
         * not show warning again for this file (before restart)
         * remove the application from `allApplications`
   * if it is very large and thus will slow things down (e.g. > x traces?)
      * potentially ask user for confirmation first? (remember decision until restart or config option override?)

## TODO (other)
* [error_handling]
   * add error examples
   * make sure, data is sent, even if error occurs?
   * if error occured, expression result might not be available
      * show `TraceType.BeforeExpression`, if result is not available
* [UI_problems]
   * improve trace label
      * if it has expression trace children, replace AST nodes with result values
      * allow to easily get all `args` of `CallExpression` traces
         * group by `callId` (i.e. `beforeCallTraceId`)
   * Executed x:
      * Value of Push/PopCallback is shown as `undefined`
      * get bindings of any variables in vicinity and display them
         * https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#bindings
* [CodeTreeWrapper]
   * don't build children if a node is collapsed
      * automatically build children when node is extended
   * remember expanded/collapsed state of previous nodes of type
      * TODO: What about children of debug node?
         * use relative path to remember state?
* [instrumentation]
   * [loops]
      * new data types:
         * `staticLoop`
         * `loop`
            * `firstTraceId` + `lastTraceId`
         * `loopRepition`
            * `i`
            * `headerVars`
      * add `loopRepititionId` to all traces in loop
         * add `loopRepitition`:
            * before `init`, and after `condition` has evaluated to `true`?
      * in loop's `BlockStart`:
         * evaluate + store `headerVars`
            * all variables that have bindings in loop header
      * fix `DoWhileLoop` :(
   * fix `Await` + `Resume`
      * async function's push + pop?
      * when resuming, we might come back from a callback etc.
         * Need to push `Resume` on demand?
      * when resuming, parent is not set
   * add one trace for each function parameter
   * [promises] keep track of `schedulerTraceId`
* [codeDeco]
   * capture *all* variables (e.g. outer-most `object` of `MemberExpression`) *after* expression has executed
      * Problem: multiple contexts (e.g. when looking at a callback and wanting to see scheduler scope variables)
         * need to access (currently selected) callStack for this
      * NOTE: when debugging functions, Chrome shows value of all variables appearing in any line, after line has executed
      * NOTE: add traces for all variable access
      * NOTE: result of `i++` is not what we want
      * trace strategies
         * VariableAssignment + VariableDeclaration
            * just capture rhs (already done; but need to associate result with variable)
         * ....
      * idea: just record all variables after line, so rendering is less convoluted?
   * show `x {n_times_executed}` after line, but only if n is different from the previous line
      * show multiple, if there are different numbers for multiple traces of line?
* [traceDetailsView]
   * `StaticTraceTDNode` -> what to display if we don't have a value?
      * categorize by run/context/loop/difference-in-callstack????
   * [values]
      * proper string representation of all kinds of values
      * record types as well?
   * `navigationNodes`
      * display better symbols in `previousParent` + `nextParent` if in separate run
   * [loops] categorize by `loopId` -> `contextId`
   * of each trace, display information relevant to the `TraceType` (instead of it's `displayName`)
      * add "selected" icon, if trace is selected
      * (by-type)
         * `PushImmediate` -> previous context (partial callstack)
         * `PopImmediate` -> next context (partial callstack)
         * `Push/PopCallback` -> schedulerTrace
         * `hasTraceTypeValue(type)` -> value
         * `CallExpression` -> call-site
            * how to render call-site + value in one line?
               * maybe add a button to toggle single-line/multi-line display of multiple details?
            * maybe only if they are different call-sites between calls?
            * use case: polymorphism/callbacks of different origins
      * other?
      * sort those by `staticTrace`
      * only build when opened
   * better loop support:
      * distinguish repeated calls of a trace from other traces at selection
      * allow to better understand and work through the repetitions
   * better value rendering (e.g. empty string (currently not shown at all); small arrays + objects)
      * function parameters
         * need to properly destruct
            * Reference: https://github.com/babel/babel/blob/master/packages/babel-plugin-transform-destructuring/src/index.js
      * also track `this`
   * trace details
      * (if multiple applications exist) `ApplicationNode` 
         * `getRelativeWorkspacePath(application.entryPointPath)`
   * details:
      * Push/Pop (of any kind) show next previous trace/context?
      * [CallbackArg] show `Push/PopCallback` nodes
      * [Push/PopCallback] `schedulerTrace`
      * highlight last+first in run
         * also: for runs originating from callbacks, make it more obvious?
   * add more helpful hover tooltips to each node
* [cursorTracesView]
   * list `staticTraces` of inner-most context at cursor
      * better display names to distinguish between `BeforeCallExpression` + `CallExpressionResult`
   * group {Push,Pop}Callback{Argument,} into one
      * show status: executed x times
      * if executed: go to callback definition
* [CodeTreeWrapper]
   * long node lists
      * when there are many nodes, add "show first 10", "show last 10", "show 25 more" buttons, instead 
* [cursorTracesView]
   * [performance] allow `getTracesAt` to deal with long iterationsof prepping them all at once
         * also applies to `dataView`
      * `iterateTracesFront`
      * `iterateTracesBack`
      * `getTraceCount`
* [cursorTracesView] + [traceSelection]
   * when user textEditor selection changes, select "best" trace at cursor
      * deselect previous trace
      * need to design heuristic:
         * if a trace was previously selected, select the one "closest" to that
         * minimum effort: try to select one in the same run (if existing)
   * when jumping between traces, keep a history stack to allow us to go forth and back
      * forth/back buttons in `TraceDetailView`?
* [instrumentation]
   * more accurate callstacks
      * find correct trace of setter in callstack
      * find correct trace of getter in callstack
      * NOTE: this is tedious :(
* [online_mode]
   * when clicking a value (and when in "online mode"), send command back to application to `console(inspect(value))`
* [dataView]
   * a more complete approach to understanding values in current context
   * properly serialize and send object data
      * consider using a native `structuredClone` implementation (or some of its hackarounds)
         * https://stackoverflow.com/a/10916838
      * performance optimization
         * when object too big, send later
            * feature: object query interface?
         * observe performance and long-running processes
            * cut things short
            * split bigger objects into chunks
            * warnings when things get out of hand
   * object tracking: list all traces that an object participated in
      * track functions
      * track everything?
         * NOTE: when `TrackEverything` is enabled, we can track callbacks 100% as well
            * (if their declarations were instrumented)
* [cli] allow to easily run multiple applications at once
   * (for proper multi-application testing)
* [instrumentation] support longer names
   * (and then hide them in tree view; show long version as tooltip)
* [MultiKeyIndex] allow for storing data by multiple keys
   * e.g. `dataProvider.util.groupTracesByType`
   * e.g. `dataProvider.util.getVisitedStaticTracesAtLine`
* [project: SimpleExpressFullstackApp]
   * purpose: test multi-application code
* [instrumentation] if we see a function call for which we have no context, find out where it goes
   * (i.e. dependency name or runtime-internal?)
      * -> then allow to easily add it to our config and re-run so we can get it next time
   * Currently: seems almost impossible
   * Option 1: [Access `[[FunctionLocation]]` programmatically](https://stackoverflow.com/questions/41146373/access-function-location-programmatically)
      * https://github.com/rwjblue/get-function-location
      * SAD: would only work on `Node` or as a browser plugin...
      * not sure yet if its possible at all in the browser [[*](https://stackoverflow.com/questions/56066523/javascript-retrieve-file-and-line-location-of-function-during-runtime)]
   * Option 2: when using `webpack` et al, instrument all functions of all required `node_modules`?
      * PROBLEM: instrumenting source-mapped files requires source-map merging which can be iffy and bug-prone
   * Option 3: while debugging, integrate with debugger API to guide user to step into function, then retrospectively retrieve data from call-site
      * most straight-forward, but UX is worse
* [instrumentation] proper `cli`
* [instrumentation] allow to easily instrument any referenced modules (not just our own code)
   * ... and optionally any of its references?
* add test setup to all libs
* add testing for serialization + deserialization (since it can easily cause a ton of pain)
* improve value serialization to skip objects that are too big


## Recently done
* [instrumentation] insert trace before function call
   * (Goal: we can step to function call before going down)
   * PROBLEM: cannot easily get "last trace before function call" 
      * either: before function call
      * or: last argument
         (however last argument might already have been instrumented)
   * SLN: Only add a trace in front, if it has no arguments


## Possible future work
* [playback] add awesome keyboard controls~
   * when "in playback mode" use arrow keys (and maybe a few other keys) to jump around very quickly
   * can we do it like [`jumpy`](https://marketplace.visualstudio.com/items?itemName=wmaurer.vscode-jumpy) ([source](https://github.com/krnik/vscode-jumpy))?
      * Type pseudo "event handler" - https://github.com/wmaurer/vscode-jumpy/blob/master/src/extension.ts#L130
   * Problem: `vscode` has some issue handling the `type` command and it's friends
      * [Stacking of type event handlers + onDidType event](https://github.com/Microsoft/vscode/issues/13441)
      * https://github.com/microsoft/vscode/issues/65876
* [codeDeco] add an `BlurBackgroundMode` `Enum`
   * `BlurBackgroundMode.Application` - "gray out" all code that is not in any executed `context`
   * more future modes:
      * `CurrentStack` - gray out all code that is not on current `stack`
         * also need to modify `dbux-babel-plugin` to store `rootContextId`
   * more future work (not yet):
      * e.g. "gray out" with higher granularity; gray out everything except all traces that were executed
* integrate `dbux` with at least one testing methodology
   * case-studies
* in `ContextTreeView`, make text of all nodes that do not belong to the current `Program` semi-transparent
   * can use `TracesByProgramIndex` for this
* serialize/deserialize all data, survive VSCode restart/reload


## Fancy ideas (Dev)
* add extra-watch-webpack-plugin https://github.com/pigcan/extra-watch-webpack-plugin?

# Installing the good stuff

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




# Known Issues

* What applications work so well with DBUX?
   * TODO: we are still exploring that
* What applications **won't** work so well with DBUX?
   * Proxies and custom object getters with side effects
      * For serialization `dbux-runtime` iterates (or will in the future iterate) over object properties
      * Thus possibly causing side effects with proxy and getter functions
      * At least it will leave unwanted traces (while attempting to "observe") - Damn you, [Observer effect](https://en.wikipedia.org/wiki/Observer_effect_(physics))!!! :(
      * TODO: at least flag traces caused by `dbux-runtime` by setting some `trace-triggered-from-dbux-builtin-call` flag while running built-in functions
         * NOTE: This will still mess with proxy and getter functions that themselves have side effects, such as caching functions, tracers and more.
* Issues under Windows
   * **sometimes**, when running things in VSCode built-in terminal, it changes to lower-case drive letter
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

# Some problems that have been worked through

* `Socket.IO` depends on `uws` which is deprecated
   * fix: tell webpack to ignore it, since by default its not being used
   * see: https://github.com/socketio/engine.io/issues/575
   * see: https://github.com/socketio/socket.io/issues/3342
   * see: https://github.com/mmdevries/uws
* `socket.io-client` bugs out because `ws` is bundled as targeting browser
   * `code-insiders .\dbux-runtime\node_modules\engine.io-client\lib\transports\websocket.js`


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


# More References
* http://latentflip.com/loupe/
   * (tagline: Visualizing the javascript runtime at runtime)
   * https://github.com/latentflip/loupe
* NOTE: the web is missing practical exercises on
   * debugging
   * callbacks
      * see https://www.quora.com/What-is-the-best-tutorial-or-course-for-understanding-JavaScript-callback-functions
