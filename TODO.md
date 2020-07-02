
## TODO (shared)
* `dbux-projects`
   * add "cancel all" button to the top
   * add a better icon for "add folder to workspace" button
   * display background runner status in `ProjectNode`
      * if running in background, show green light
      * when clicked -> cancel all
* grouping: add new `GroupNode` controller component
   * `ContextGroupNode`: more than one `context`s (`realContext`) of `parentTraceId`
   * `RecursionGroupNode`: if we find `staticContext` repeated in descendant `context`s
      * (e.g. `next` in `express`)











## TODO (`dbux-projects`)
* add `backgroundProcesses` management
* add auto-commit function
   * allow saving own project changes
   * when switching between bugs, need to commit all changes
      * when switching back to that bug, need to fetch that commit
   * allow reviewing diff of all own changes
   * allow comparing to actual solution? (after submitting?)
   * [future work] allow sending to backend


* [Deployment]
   * fix up paths
   * discern correctly between `npm` and `yarn`
   * improve dependency management






## dbux-practice
   * user interaction log
   * backend
   * user login (github oauth)
      * see https://github.com/microsoft/vscode/issues/91309
   * bug difficulty classification
   * hint system + more relevant information








## TODO (other)
* [dbux-practice] complete workflow design
* [dbux-graph] when clicking the scrollbar the first time, it disappears, and a gray square pops up in the top left corner instead
* parent trace wrong for:
   * `callback.call(this, JSON.parse(localStorage[name]))`
   * `callback(() => { ... })`
   * -> probably because args are not traced correctly
* dbux-graph:
   * add "id" to context nodes (toolbar-togglable)
* fix: in `o[x]`, `x` is not traced
* error tracing
   * when encountering errors caught mid-way
      * `resolveCallIds` will fail
   * error resolution doesn't work properly with recursion
      * (probably because there are unmatched `BCE`s on the stack)
* Object rendering:
   * visualize when value got ommitted/pruned
   * show actual string length, if pruned
   * make valueCollection prune/omit parameters easily configurable
* `dbux-graph` errors
   * bugs out if visibility or column changes
      * -> host receives invalid `reply` messages that it did not look for
      * -> it appears we are not resetting `Ipc` object properly?
         * -> or are there two clients that live in parallel?
* in TrackedObjectTDNode, render `valueString`?
* get ready for deployment!
   * setup w/ lerna and prepare production/publishable build?
   * add to `extensions` folder
      * see: https://github.com/Microsoft/vscode/issues/25159
* instrument `try` blocks
   * test errors in `try/finally` -> find errors in `try` block?
   * also show some sort of error symbol when tracing `catch` block?
* some assignments (and possibly other expressions) are traced twice
   * e.g. `this.subscribers = []` (one `ExpressionValue`, one `ExpressionResult`)
* fix: `function` declarations are not tracked
   * store staticContextId by `function` object, so we can quickly jump to them and find all their references
* fix: use correct package manager (npm vs. yarn) when working with libraries in `dbux-projects`
* fix: strings are currently tracked -> disable tracking of strings
* fix: `traveValueLabels`
   * get callee name from instrumentation
* fix TDV: "Trace Executed: Nx"
   * improve label of "group by" node
   * need to re-design grouping a bit
      * for simple cases, no grouping needed
      * current groups are by: Run, Context, Parent
* allow for mixed type objects for object tracking
   * in `express`, `application` object is also a function
   * for "objectified functions": allow inspecting object properties
   * Problem: How to determine what is an "objectified function"?
      * -> `for in` loop runs at least once?
* projects -> express
   * when mocha test timeout happens, we see:
      1. -> `Error: timeout of 2000ms exceeded`
      2. -> `[Dbux] (...) received init from client twice. Please restart application`
   * -> it seems to try to re-init after the error somehow.
      * Did it reconnect multiple times or restart the process after being killed off?
* fix callback tracking
   * partial solution: use data tracking for callbacks
      * TODO: also data-trace function at declaration
      * NOTE: Won't work as comprehensively at all
         * Cannot accurately track how callbacks were passed when executing them without it really; can only guess several possibilities
         * Known issues: 
            * identity-tracking functions breaks with wrapper functions, as well as `bind`, `call`, `apply` etc...
            * We cannot easily capture all possible calls using instrumentation, since some of that might happen in black-boxed modules
   * NOTE: longjohn et al patch all potential scheduler calls for this, see: https://github.com/tlrobinson/long-stack-traces/blob/master/lib/long-stack-traces.js#L89
* [dbux-projects]
   * support multiple tests per bug
      * e.g. https://github.com/BugsJS/express/releases/tag/Bug-10-test -> https://github.com/BugsJS/express/commit/690be5b929559ab4590f45cc031c5c2609dd0a0f
   * `eslint` sample bugs require setting a node version
      * NOTE: BugsJs uses `n` for that; see `myTest.py`
         * -> `n` is not natively supported on Windows (see https://github.com/tj/n/issues/511)
   * report error if `applyPatch` failed
   * only run webpack if not started yet: don't kill project-wide backgroundProcesses when starting bug of same project?
      * fix this by remembering per-bug backgroundProcesses, as well as per-project
         * -> only kill per-bug backgroundProcesses when changing bug, but not changing project
   * fix patch file problems
      * generate commits from patch files so we can reliably determine whether patch/commit was applied?
      * also requires managing user changes
   * when bug patch is applied, might have to: (1) remove `.git` folder, or (2) commit changes, so `SCM` plugins won't show user the changes
   * `nodeRequireArgs` in `dbux-projects/src/nodeUtil` only supports relative paths?
* projects -> jest
   * (if test not asynchronous) exits right away, not allowing dbux-runtime to send data
   * also swallows "exit check" console messages
   * see if we can use jest with `dbux-register`
      * currently we provide `dbux-babel-plugin` manually (via `.babelrc.js`), and set `--cache=false`

* fix: small trace odities
   * for optional call, don't trace as `CallExpression` but trace as `ExpressionResult` if there is no function
   * when selecting a traced "return", it says "no trace at cursor"
      * (same with almost any keywords for now)
   * `if else` considers `else` as a block, and inserts (potentially unwanted) code deco
* fix: setup `eslint` to use correct index of `webpack` multi config to allow for `src` alias
   * Problem: won't work since different projects would have an ambiguous definition of `src`
* fix: provide an easier way to use `ipynb` to analyze any application
* fix: function names
   * also: `displayName` is often too long for proper analysis in py/callGraph
      * -> do not add source code of function itself -> change to `cb#i of A.f` instead
* fix: `staticTraceId` must resemble AST ordering for error tracing to work correctly
   * `CallExpression.arguments` are out of order
      * e.g. in `findLongestWord/1for-bad1`
      * because:
         * -> 1. `BCE`
         * -> 2. let other visitors take care of arguments
         * -> 3. let other visitors take care of result
         * -> 4. wrap all uninstrumented arguments in `Exit`
   * examples of out-of-order static traces
      * `awaitVisitors`, `loopVisitors`
      * anything that is not build into the singular visitor tree
   * Sln: generate `orderId` for each ast node and map to `staticTraceId`
      * Add a new pass to generate `orderId` for each node before starting instrumentation
         * Need to store `orderId` by `context`
      * When tracing, also store `orderId` in `staticTrace`
      * When error observed, lookup `staticTrace` by `orderId`
         * Problem: data dependencies: need to lookup when adding traces
            * Sln: Initialize `static` data and pure indexes of `static` data first
   * Problem: conditions on branches cannot predict the branch which observes the errors
      * Sln: make sure to trace every branch anywhere
         * e.g. `if`, `ternary`, ... other?
* [error_handling]
   * more TODOs
      * handle `try` blocks
   * (README) How does it work?
      * mark possible `exitTraces`:
         1. any `ReturnStatement`
         1. the end of any function
      * Once a function has finished (we wrap all functions in `try`/`finally`), we insert a check:
         * If `context.lastTraceId` is in `exitTraces`, there was no error
         * else, `context.lastTraceId` caused an error
* fix: `throw` + `await` instrumentation
   * test: when error thrown, do we pop the correct resume and await contexts?
* [variable_tracking]
   * Nodes
      * any expressions: https://github.com/babel/babel/tree/master/packages/babel-types/src/validators/generated/index.js#L3446
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
      * evaluate + store `headerVars` (all variables that have bindings in loop header)
* [testing]
   * add `dbux-cli` and `samples` to the `webpack` setup
   * finish setting up basic testing in `samples`
      * move a basic `server` implementation from `dbux-code` to `dbux-data`
      * then: let sample tests easily run their own server to operate on the data level
      * make sure the `test file` `launch.json` entry work withs `samples/__tests__`
* [loops]
   * fix `DoWhileLoop` :(
* [generators]
   * not done yet :(
   * possible Test projects
      * `mongoose`
         * The call graphs of the mongoose module have the most unique
   edges, which is caused by JavaScript generator functions.
            * ref: [Towards the Efficient Use of Dynamic Call Graph Generators of Node.js Applications [2020]]
* [async_runs]
   * possible Test projects
      * `shields`
            * ref: [Towards the Efficient Use of Dynamic Call Graph Generators of Node.js Applications [2020]]
   * re-group execution order s.t. "asynchronous runs" can be visually running "as one"
   * consider: async functions (in a way) run parallel to normal functions
      * (while execution is single-threaded, I/O and other system tasks will keep on doing work in the background)
   * what to do with callbacks that preceded and then triggered a `Resume`?
   * link up promise chains
   * make sure that we don't accidentally use/cause evil promise semantics [[1](https://stackoverflow.com/questions/46889290/waiting-for-more-than-one-concurrent-await-operation)] [[2](https://stackoverflow.com/questions/58288256/with-a-promise-why-do-browsers-return-a-reject-twice-but-not-a-resolve-twice/58288370#58288370)]
   * double check against the [Promise/A+ spec](https://promisesaplus.com/#notes), especially semantics of promise rejections and their execution order
      * rejections might be triggered from "platform code"
      * https://stackoverflow.com/questions/42118900/when-is-the-body-of-a-promise-executed
      * http://www.ecma-international.org/ecma-262/6.0/#sec-promise-executor
* fix: `sourceHelper` must use original code, but exclude comments
* fix: `StaticTrace.staticContextId`
   * generally less accurate than `trace.context.staticContextId`
   * cannot work correctly with interruptable functions
   * -> repurpose as `realStaticContextId`?
* advanced instrumentation?
   * we could patch `babel-traverse` to support non-type-based visitors:
      1. [context.shouldVisit](https://github.com/babel/babel/blob/a34424a8942ed7346894e5fd36dc1490d4e2190c/packages/babel-traverse/src/context.js#L25)
      2. [traverse.node](https://github.com/babel/babel/blob/master/packages/babel-traverse/src/index.js#L59)
* [error_handling]
   * add error examples
   * make sure, data is sent, even if error occurs?
   * if error occured, expression result might not be available
      * show `TraceType.BeforeExpression`, if result is not available
* [promises] keep track of `schedulerTraceId`
* [params]
   * add trace/valueRef for `varAccess` of function `params`
      * Consider: replace `varAccess` with single traces for `params`?
* [BaseTreeViewNodeProvider]
   * long node lists
      * when there are many nodes, add "show first 10", "show last 10", "show 25 more" buttons, instead 
* [cursorTracesView]
   * [performance] allow `getTracesAt` to deal with long iterations; not loading them all at once
         * also applies to `dataView`
      * `iterateTracesFront`
      * `iterateTracesBack`
      * `getTraceCount`
* [cursorTracesView] + [traceSelection]
   * when jumping between traces, keep a history stack to allow us to go forth and back
      * forth/back buttons in `TraceDetailView`?
* [instrumentation]
   * more accurate callstacks
      * find correct trace of setter in callstack
      * find correct trace of getter in callstack
      * NOTE: this is very hard :(
* [interactive_mode]
   * when clicking a value (and when in "online mode"), send command back to application to `console.log(inspect(value))`
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
   * be careful:
      * `__filename` + `__dirname` do not work w/ webpack when not targeting node
* [instrumentation] support longer names
   * (and then hide them in tree view; show long version as tooltip)
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
* [cli] proper cli
* [instrumentation] allow to easily instrument any referenced modules (not just our own code)
   * ... and optionally any of its references?
* add test setup to all libs




## TODO: async!
* fix: `await` instrumentation
   * `Await`: `resumeTraceId` is `TraceType.Resume`, but can also be `ReturnArgument` or `ThrowArgument`?
* fix: `CallExpression`, `Function`, `Await` have special interactions
   * they all might be children of other visitors
   * NOTE: currently all other visitors use `wrapExpression`
      * -> checks `isCallPath` and has special handling only for that
      * -> Problem: come up with comprehensive conflict resolution here
         * `CallExpression`: `traceReturnType` controlled if `return` or `throw`
         * `Function`: no wrapping for functions
   * split up `functionVisitor`
      * enter
         * child('body'): generate `pushTraceId`
      * exit
         * child('body'): generate `popTraceId` -> instrument
   * split up `awaitVisitor`
      * exit: 
         * child('argument'): generate `preTraceId` -> instrument `preAwait`
         * self: generate `resumeTraceId` -> instrument `await`
      ```js
      _dbux.postAwait(
      (await _dbux.wrapAwait(
         xArg,
         _contextId6 = _dbux.preAwait(10, 29)
      )), 
      _contextId6, 
      30
      );
      ```
















## TODO (nice-to-haves)
* fix source maps
   * when `dbux-code` reports an error, stack trace does not apply source maps
* dbux-graph web components
   * map data (or some sort of `id`) to `componentId`
   * batch `postMessage` calls before sending out
   * write automatic `dbux-graph-client/scripts/pre-build` component-registry script
* in editor, when we select a range with the cursor, only select traces that are completely contained by that range (e.g. when selecting `g(x)` in `f(g(x));`, do not select `f`)
* add `Cancel` button to `projectsView`
   * NOTE: needs a basic event system to monitor all project + bug activity
   * -> don't show button when nothing running
   * while any bug is running...
      * need to cancel before being able to run another bug
      * "run" button of that bug becomes "cancel" button
* fix: we cannot currently easily add images to the `graph` from the `resource` folder
   * -> define a `customElement` (e.g. `img-local`) that wraps an `img` element
      * prepend the img's `src` attribute with `GraphWebView.resourcePath`
      * -> Concept: "web component" (see here: https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_templates_and_slots)

* largely improve `value` storage + rendering:
   * make sure that `_getKeysErrorsByType` never contains `Object.prototype` itself
   * refactor value storing
      * go to `dbux-runtime` -> `valueCollection.js`
         * (NOTE: in plain objects + arrays, we currently allocate one `ValueRef` for each primitive)
         * -> instead, let `ValueRef` allocate a single array to store *all* it's primitives
         * -> use lazy initialization for that array: only when at least one primitive is discovered -> allocate the array
      * go to `dbux-data` -> `DataProvider.js` -> `class ValueCollection`
      * change `dataProviderUtil`'s value reader methods correspondingly
         * (NOTE: there is about 10 of them, starting with `getValueTrace`)
      * Testing?
         * in `runtime -> valueCollection.js`: make sure to set `Verbose = true`
         * use `memberExpressions1.js`
   * fix `ValueTDNode` to render individual object + array entries using the same heuristics as `traceValueString`

[Persistance]
* use `Memento` to persist extension state through VSCode restarts
   * -> reference: https://stackoverflow.com/questions/51821924/how-to-persist-information-for-a-vscode-extension
* what to persist?
   * dbux-data
      * all applications' data: save to/load from memento
         * HINT: see `userCommands` -> `doExport`
      * `traceSelection` -> `traceId`
   * Graph
      * re-open GraphWebview if open
      * store state of all components by `componentId`
         * careful: some components have invisible state (state that is not in `this.state`), such as `HighlightManager`
         * -> for that, we might need a basic serialization system for components











## Possible future work
* [codeDeco]
   * capture *all* variables (e.g. outer-most `object` of `MemberExpression`) *after* expression has executed
      * Problem: multiple scopes -> multiple contexts
         * need to be able to access all variables of current stack
   * display variable values at end of line
      * (same as when Chrome is debugging?)
      * NOTE: result of `i++` is not what we want
      * trace strategies
         * VariableAssignment + VariableDeclaration
            * just capture rhs (already done; but need to associate result with variable)
      * idea: just record all variables after line, so rendering is less convoluted?
   * show `x {n_times_executed}` after line, but only if n is different from the previous line
      * show multiple, if there are different numbers for multiple traces of line?
* [project: SimpleExpressFullstackApp]
   * purpose: test multi-application (full-stack) code
* fix: vscode auto attach is not working?
* add `DataFilter`
   * when hiding graph nodes, actually change global `dbux-data` filter settings
   * in any view, as well as TextEditor decorations, only retrieve traces, collections, values etc. that match current filter conditions
* refactor `Toolbar` -> move all mode control to `GraphRender` component in `GraphDocument.controllers`
   * NOTE: access via `this.context.graphDocument.controllers.getComponent`
   * remove `this.traceMode` from `GraphDocument`
      * NOTE: don't add any properties directly to a component, unless you have a very good reason to
* configurable keyboard shortcuts for navigation buttons
   * for configurable keybindings, see:
      * https://code.visualstudio.com/api/references/contribution-points#contributes.keybindings
* add files to `ApplicationsView`
   * list all files as children for each application
      * click:
         * if not open: open file -> then go to first trace in file
         * if open: just open (don't go to trace)
   * group all "previous runs" under a "(previous runs)" node
* configuration that allows user to make changes and keep the changes after restarting
   * https://code.visualstudio.com/api/references/contribution-points#contributes.configuration
   * https://github.com/microsoft/vscode-extension-samples/tree/master/configuration-sample

* [slow warning]
   * display a warning at the top of EditorWindow if it is very large and thus will slow things down (e.g. > x traces?)
      * potentially ask user for confirmation first? (remember decision until restart or config option override?)
* keyword `wordcloud`
   * prepare function to generate all keywords in all `staticContexts` and their `fileName`s (without ext) of a single run
      * multiply weight by how often they were called (use `contexts`, rather than `staticContexts`)
      * TODO: we would also want to use the folder name, but for that, we first have to add instrumentation that identifies the relative project path via `package.json`
   * add as "suggestions" to the `"filter by searchTerm"` `QuickInput`, sort by weight
   * (we will add that to webview later)
   * fine-grained keyword extraction, split names by:
      1. upper-case letters: `addElement` -> `add`, `element`
         * careful: `addUID` -> `add`, `uid`
      1. `.`: `a.b` -> `a`, `b`
      1. `_`: `some_func` -> `some`, `func`
      1. `ClassLoader.loadClass` -> (2x `class`, `loader`, `load`)
         * NOTE for later: `loader` + `load` can be identified as the same, using `stemitization`, `lemmatization`
            * https://www.datacamp.com/community/tutorials/stemming-lemmatization-python
            * https://nlp.stanford.edu/IR-book/html/htmledition/stemming-and-lemmatization-1.html
   * NOTE: is there some JS or python NLP packages to help with this?
* [SubGraph_Filtering]
   * add two new buttons (for filtering) to each `callGraphView` root node: include/exclude
   * when filter active:
      * only show those runs + contexts in `callGraphView`
      * only show those traceDecos
   * add a new "clear filters" button at the top of the `callGraphView`
   * add a new "only this trace" filter button to `callGraphView`
      * only runs that passed through this trace
* [UI]
   * add a new option `showHideIfEmpty` to `BaseTreeViewNode`:
      * if `true`: render new button in node that toggles the `hideIfEmpty` behavior
      * button icon:  (???) https://www.google.com/search?q=empty+icon&tbm=isch
* [applicationDisplayName]
   * find shortest unique part of 'entryPointPath' of all `selectedApplications`
      * update in `_notifyChanged`?

* [contextChildrenView]
   * treeview that shows partial `execution tree` in the context of the selected trace
   * Nodes:
      * all child `loop`s + `context`s of current context in order
      * add one node for current trace to show where it is between the other calls
      * group child `contexts` into a new intermediate node, if they all originate from the same `trace`
         * (e.g. `find`, `map`, `forEach`, `reduce` and many more)
* [configuration + settings]
   * automatically store `BaseTreeViewNodeProvider.idsCollapsibleState` so it won't reset when re-opening
* [UI]
   * add a button to `selectedTraceView`: clear currently selected trace
   * add a button to `selectedTraceView`: "Select trace by `traceId`"
      * NOTE: probably use QuickInput to ask user for id
      * used for debugging specific traces uses all available visualization tools
* [Performance]
   * Weird bug: when we run w/ debugger attached in extension-host VSCode window, code runs 20x slower
   * NOTE: Bug w/ latest VSCode only?
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
* serialize/deserialize all data, survive VSCode restart/reload


## Fancy ideas (Dev)
* add extra-watch-webpack-plugin https://github.com/pigcan/extra-watch-webpack-plugin?

