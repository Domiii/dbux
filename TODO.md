
# TODO

## TODO (shared)
* navigation:
   * change `CallGraph.get{Next,Previous}InContext` to ignore trace if `isDataOnlyTrace` return `true`
   * when clicking any of the nav buttons, select the `NavigationNode` (this way, the buttons stay visible)
   * if no child found, let `{Next,Previous}ChildInContext` jump to `{start,end}` of context (same as `{Previous,Next}ParentContext`?)
* `Object traces`
   * before highlight: collapse all + disable sync mode
* [TraceDetailsView] add Navigation buttons: go to next/previous trace of this staticTrace
* when highlighting is enabled, `background` color of `popper` should not be affected
* when clicking error button: call `reveal({focus: true})` on `TraceDetailsView`
* `dbux-projects`
   * add "cancel all" button to the top
   * add a better icon for "add folder to workspace" button
   * display background runner status in `ProjectNode`
      * if running in background, show green light
      * when clicked -> cancel all
* refactor `Toolbar` -> move all mode control to `GraphRender` component in `GraphDocument.controllers`
   * NOTE: access via `this.context.graphDocument.controllers.getComponent`
   * remove `this.traceMode` from `GraphDocument`
      * NOTE: don't add any properties directly to a component, unless you have a very good reason to
* add buttons to `ContextNode`: go to next/previous context of this staticContext (`parentTrace` of next/previous context)
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

* add `DataFilter`
   * when hiding graph nodes, actually change global `dbux-data` filter settings
   * in any view, as well as TextEditor decorations, only retrieve traces, collections, values etc. that match current filter conditions

* largely improve `value` storage + rendering:
   * meaningful visualization to indicate when object got ommitted/pruned
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


# TODO (shared, low priority)
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












## TODO (dbux-graph)
* show vertical indicator of where we are within a `ContextNode` (relative to context children)
   * -> maybe draw a horizontal line in `node-left-padding`
   * -> if current trace is parent trace of some child, also indicate that somehow?
* grouping: add new `GroupNode` controller component
   * `ContextGroupNode`: more than one `context`s (`realContext`) of `parentTraceId`
   * `RecursionGroupNode`: if we find `staticContext` repeated in descendant `context`s
      * (e.g. `next` in `express`)
* fix: don't generate `valueLabels` if values are hidden
   * add proper `NodeDecoration` controller component to `GraphDocument`?
* add a css class for font scaling (e.g. `.scale-font`): when zooming, font-size stays the same
   * NOTE: can use `vh` instead of `px` or `rem` (see: https://stackoverflow.com/questions/24469375/keeping-text-size-the-same-on-zooming)
* replace bootstrap with [something more lightweight](https://www.google.com/search?q=lightweight+bootstrap+alternative)
* NOTES
   * `render` does NOT propagate to children (unlike React)











## TODO (`dbux-projects`)
* add `backgroundProcesses` management
* add auto-commit function
   * allow saving own project changes
   * when switching between bugs, need to commit all changes
      * when switching back to that bug, need to fetch that commit
   * allow reviewing diff of all own changes
   * allow comparing to actual solution? (after submitting?)
   * [future work] allow sending to backend
* load bugs from bug database automatically
* fix: vscode auto attach is not working?


* [Deployment]
   * fix up paths
   * discern correctly between `npm` and `yarn`
   * improve dependency management

* [dbux-practice]
   * difficulty classification
   * hint system + more relevant information

* [more]
   * support for projects with webpack
   * add webpack to projects that don't have it to speed up instrumentation (by a lot)
















## TODO (dbux-tutorials) - Getting to know DBUX
* Design considerations
   * Fast paced, not too complex, easy to grasp
   * Touches on all Dbux core features
   * Allows for comparison between Dbux and traditional tools
   * Allows for strategy to be developed and discussed???
* Beginner: Simple exercises (e.g. broken loop)
* Intermediate: todomvc
* Advanced: express











## TODO (other)
* get ready for deployment!
* [dbux-projects]
   * support multiple tests per bug
      * e.g. https://github.com/BugsJS/express/releases/tag/Bug-10-test -> https://github.com/BugsJS/express/commit/690be5b929559ab4590f45cc031c5c2609dd0a0f
   * `eslint` sample bugs require setting a node version
      * NOTE: they use `n` for that; see `myTest.py`
         * -> `n` is not natively supported on Windows (see https://github.com/tj/n/issues/511)
* practice design:
   * how to practice with bugs that require parsing a lot of code at first?
      * -> have simpler bugs in each parts of the code, so the code is more accessible
* [dbux-graph] when clicking the scrollbar the first time, it disappears, and a gray square pops up in the top left corner instead
* fix: instrumentation of assignments w/ `init instanceof CallExpression`
* projects
   * report error if `applyPatch` failed
   * only run webpack if not started yet
      * don't cancel all when clicking a button; add "Cancel All" button instead
   * visualize background process (webpack) status
   * fix patch file problems
      * generate commits from patch files so we can easily determine whether patch/commit was applied
   * when bug patch is applied, might have to: (1) remove `.git` folder, or (2) commit changes, so `SCM` plugins won't show user the changes
   * `nodeRequireArgs` in `dbux-projects/src/nodeUtil` only supports relative paths?
* instrument `try` blocks
   * test errors in `try/finally` -> find errors in `try` block?
   * also show some sort of error symbol when tracing `catch` block?
* parent trace wrong in case of `call`, `apply` et al
* jest 
   * (if test not asynchronous) exits right away, not allowing dbux-runtime to send data
   * also swallows exit check console messages?
   * see if we can use jest with `dbux-register`
      * currently we provide `dbux-babel-plugin` manually (via `.babelrc.js`), and set `--cache=false`
* error tracing
   * when encountering errors caught mid-way
      * `resolveCallIds` will fail
   * error resolution doesn't work properly with recursion
      * (probably because there are unmatched `BCE`s on the stack)
* big graphs (e.g. `javascript-algorithms` -> `bug #1`) build very slowly, and we have to wait until it finished building to see anything
   * turns out: it's a lot faster in non-debug mode
* `dbux-graph` errors
   * bugs out if visibility or column changes
      * -> host receives invalid `reply` messages that it did not look for
      * -> it appears we are not resetting `Ipc` object properly?
         * -> or are there two clients that live in parallel?
   * bugs out when working with multiple applications
   * Client: `Received invalid request: componentId is not registered: 1629 - command="_publicInternal.dispose", args="[]"`
* fix source maps
   * when `dbux-code` reports an error, stack trace does not apply source maps
* in TrackedObjectTDNode, render `valueString`?
* fix: in `o[x]`, `x` is not traced
* some assignments (and possibly other expressions) are traced twice
   * e.g. `this.subscribers = []` (one `ExpressionValue`, one `ExpressionResult`)
* deployment: add to `extensions` folder
   * see: https://github.com/Microsoft/vscode/issues/25159
* fix: `function` declarations are not tracked
   * store staticContextId by `function` object, so we can quickly jump to them and find all their references
* fix: use correct package manager when working with libraries in `dbux-projects`
* fix: strings are currently tracked -> disable tracking of strings
* fix: `traveValueLabels`
   * get callee name from instrumentation
* fix TDV: "Trace Executed: Nx"
   * improve label of "group by" node
   * need to re-design grouping a bit?
      * current: Run, Context, Parent
* allow for mixed type objects for object tracking
   * in `express`, `application` object is also a function
   * for "objectified functions": allow inspecting object properties
   * Problem: How to determine what is an "objectified function"?
      * -> `for in` loop runs at least once?
* fix: in express when mocha test timeout
   * we see:
      1. -> `Error: timeout of 2000ms exceeded`
      2. -> `[Dbux] (...) received init from client twice. Please restart application`
   * -> it seems to try to re-init after the error somehow.
      * Did it restart the process after being killed off?
* fix callback tracking
   * partial solution: use data tracking for callbacks
      * TODO: also data-trace function at declaration
      * NOTE: Won't work as comprehensively at all
         * Cannot accurately track how callbacks were passed when executing them without it really; can only guess several possibilities
         * Known issues: 
            * identity-tracking functions breaks with wrapper functions, as well as `bind`, `call`, `apply` etc...
            * We cannot easily capture all possible calls using instrumentation, since some of that might happen in black-boxed modules
   * NOTE: longjohn et al patch all potential scheduler calls for this, see: https://github.com/tlrobinson/long-stack-traces/blob/master/lib/long-stack-traces.js#L89
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
* fix: small trace odities
   * for optional call, don't trace as `CallExpression` but trace as `ExpressionResult` if there is no function
   * when selecting a traced "return", it says "no trace at cursor"
      * (same with almost any keywords for now)
   * `if else` considers `else` as a block, and inserts (potentially unwanted) code deco
* fix: setup `eslint` to use correct index of `webpack` multi config to allow for `src` alias
   * Problem: won't work since different projects would have an ambiguous definition of `src`
* fix: provide an easier way to use `ipynb` to analyze any application
* dbux-graph web components
   * map data (or some sort of `id`) to `componentId`
   * batch `postMessage` calls before sending out
   * write automatic `dbux-graph-client/scripts/pre-build` component-registry script
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
      * Fix `super`
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
* [InfoTDNode]
   * Push/Pop (of any kind) show next previous trace/context?
   * [CallbackArg] -> show `Push/PopCallback` nodes
   * [Push/PopCallback] -> `schedulerTrace`
   * [hasValue()] -> value
   * [hasArguments()] -> args
* [error_handling]
   * add error examples
   * make sure, data is sent, even if error occurs?
   * if error occured, expression result might not be available
      * show `TraceType.BeforeExpression`, if result is not available
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
* [lerna]
   * setup w/ lerna and prepare production/publishable build
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
* [cli] proper cli
   * fix: `installDbuxCli`
* [instrumentation] allow to easily instrument any referenced modules (not just our own code)
   * ... and optionally any of its references?
* add test setup to all libs
* add testing for serialization + deserialization (since it can easily cause a ton of pain)
* improve value serialization to skip objects that are too big
* [dbux-cli -> dbux run]
   * breakpoints in dbux-run don't work anymore unless at least one debugger statement is added?







## TODO: Testing + Case studies
* [Goal: Make sure dbux runs on hundreds of popualr JS projects] - Use CLI to automatically check out and test github repos
   1. git clone X
   1. {npm,yarn} install
      * (custom install steps here?)
   1. npm test
   1. dbux-npm test
      * run `npm test` but with dbux instrumentations in place
* "Interactive Open Source Case Studies"
   * https://github.com/search?utf8=%E2%9C%93&q=language%3Ajavascript+stars%3A%3E1000&type=Repositories










## Possible future work
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

