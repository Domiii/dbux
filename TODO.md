
# TODO

## TODO (dbux-code + dbux-data; high priority)
* multi-purpose `TreeView`: merge several of our (not so frequently used treeViews) into one
   * -> Make sure it is still easy to use
* add a command to toggle (show/hide) all intrusive features
   * includes:
      * show/hide all `codeDeco`s
      * show/hide all other buttons in the top right
   * command name: `Dbux: Toggle Controls`
* [edited warning]
   * display a warning at the top of EditorWindow if it has been edited after the time of it's most recent `Program` `Context`
      * see: `window.showInformationMessage` and `window.showWarningMessage` ([here](https://code.visualstudio.com/api/references/vscode-api#window.showWarningMessage); [result screen](https://kimcodesblog.files.wordpress.com/2018/01/vscode-extension1.png))
      * offer buttons to let user reply...:
         * do not show warning again for this file (before restart)
         * remove the application from `allApplications`
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
* [tracesAtCursor]
   * remove this view, replace with button at the top left
      * icon = crosshair (⌖)
         * e.g.: https://www.google.com/search?q=crosshair+icon&tbm=isch
      * select `getMostRelevantTraceAtCursor()` (see below)
      * if it returns `null`, change button color to gray, else red
   * `getMostRelevantTraceAtCursor()` function
      * Notes
         * can use generator function for this
         * `onData`: reset
      * if `selectedTrace` exists:
         * only select traces of same `staticContextId` (or, if `Resume` or `Await`, of same `staticContextId` of `parentContext`)
         * prefer traces of minimum `contextId` (or, if `Resume` or `Await`, `parentContextId`) distance
         * prefer traces of minimum `runId` distance
         * prefer traces of minimum `traceId` distance
      * if there is no `selectedTrace`:
         * same order as `getTracesAt(application, programId, pos)`
* [SubGraph_Filtering]
   * add two new buttons (for filtering) to each `callGraphView` root node: include/exclude
   * when filter active:
      * only show those runs + contexts in `callGraphView`
      * only show those traceDecos
   * add a new "clear filters" button at the top of the `callGraphView`
   * add a new "only this trace" filter button to `callGraphView`
      * only runs that passed through this trace
* [traceDetailsView]
   * [StaticTraceTDNode] of each trace: display more relevant information
      * `GroupMode` (button to toggle in the node)
         * no grouping (default)
         * by contextId
         * by runId -> contextId
         * by `parentContextTraceId` (e.g. for `reduce` etc.)?
         * [for callbacks only] "Callback mode"
            * add one group per `call` trace (e.g. `target.addEventListener(type, callback, !!capture);`)
               * add all `PushCallbacks` of any `callback` in that call as child
            * sort by `createdAt` in descending order
            * very useful e.g. in `$on` function inside `todomvc`!
         * combination of the above
      * offer multiple `TraceDisplayMode`s:
         * value
         * ancestor context
            * allow cycling through levels of depth (parent -> grandparent etc)
         * descendant context
            * allow cycling through levels of depth (child -> grandchild etc)
         * related info: get bindings of relevant nearby variables and display those?
            * https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#bindings

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












## TODO (`dbux-projects`)
* list projects
* for each project, list it's bugs to choose from
* project installer
   * add `launch.json`
      * (possibly a more cross-IDE-compatible generalized solution?)
   * add webpack
* have a button: "prepare" bug + open it in VSCode
* save changes automatically before moving to another bug
   * NOTE: switching between bugs requires `git checkout` which needs local changes to be reset before succeeding
* difficulty classification
* hint system + more relevant information
* file management
   * asset folder?
   * target folder?
   * allow target folder to be configurable












## TODO (other)
* fix: instrumentation - in `findLongestWord/1for-bad1`, `staticTraceId` order is messed up
   * (see below: "AST ordering")
* check: does `f(a, await b, c)` work correctly?
   * -> probably not, because result needs to be resolved later
   * `resolveCallIds` would try to resolve results too fast
* fix: rename `dbux-case-studies` to `dbux-projects`
* fix: setup `eslint` to use correct index of `webpack` multi config
* (big goal: design projects, bugs, comprehension questions + tasks)
* fix: provide an easier way to use `ipynb` to analyze any application
* dbux-graph web components
   * map data (or some sort of `id`) to `componentId`
   * batch `postMessage` calls before sending out
   * replace bootstrap with [something more lightweight](https://www.google.com/search?q=lightweight+bootstrap+alternative)
   * NOTES
      * `render` does NOT propagate to children (unlike React)
   * write `dbux-graph-client/scripts/pre-build` component-registry script
   * batch `postMessage`

* fix: `staticTraceId` must resemble AST ordering for error tracing to work correctly
   * examples of out-of-order static traces
      * `CallExpression.arguments`
      * `awaitVisitors`, `loopVisitors` and more
      * and many more...
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
   * Problem: the actual error trace is the trace that did NOT get executed
      * Sln: patch function's `Pop`'s `staticTrace` to be the one that follows the last executed trace (that is the "error trace")
         * NOTE: If there are no errors, set `Pop`'s `staticTrace` to be the `FunctionExit` trace
            * -> new concept `isFunctionExitTrace` is either `return` or `EndOfFunction`
            * -> need to insert `EndOfFunction` for every function
         * Problem: How to "guess" and "patch" the "missing trace"?
            * There is no `staticTrace` for `ExpressionResult` (it actually shares w/ `BCE`)
               * Sln: `getBCEForCallTrace`
            * NOTE: `getters` and `setters` might actually work out-of-the-box this way, as well
            * Data dependencies: Must be done before adding `pop` trace, but depends on `LastTraceInRealContext`
               * Sln1: Can the runtime track `LastTraceInRealContext`?
                  * Quite easily!
               * Sln2: 
                  * (b) lookup worst case: build temporary index (`groupby('contextId')` etc.)
                     * NOTE: `TracesByRealContextIndex` needs that extra layer on top of it
                  * NOTE: probably not going to go any better
   * How does it work?
      * mark possible `exitTraces`:
         1. any `ReturnStatement`
         1. the end of any function
      * Once a function has finished (we wrap all functions in `try`/`finally`), we insert a check:
         * If `context.lastTraceId` is in `exitTraces`, there was no error
         * else, `context.lastTraceId` caused an error
   * [errors_and_await]
      * test: when error thrown, do we pop the correct resume and await contexts?
* fix: Call Graph Roots -> name does not include actual function name
   * -> add `calleeName` to `staticTrace`?
   * -> `traceLabels`
   * `groups by Parent` seems buggy:
      * it shows `!!capture`
   * use `TraceNode` for group nodes when grouping by `parent` (so we can click to go there)?
* test
   * group modes (see `StaticTraceTDNodes.js`)
   * new trace select button (see `relevantTraces.js`)
* re-design `Call Graph Roots` to work with new group+merge strategy
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
* [values]
   * better overall value rendering
* [testing]
   * add `dbux-cli` and `samples` to the `webpack` setup
   * finish setting up basic testing in `samples`
      * move a basic `server` implementation from `dbux-code` to `dbux-data`
      * then: let sample tests easily run their own server to operate on the data level
      * make sure the `test file` `launch.json` entry work withs `samples/__tests__`
* [callbacks]
   * add function mapping + also map to all their callbacks
   * Problem: we cannot wrap callbacks, as it will break the function's (or class's) identity.
      * This breaks...
         * `instanceof` on any class variable that is not the actual declaration of the class (i.e. when returning a class, storing them in other variables, passing as argument etc...)
         * triggers a babel assertion when targeting esnext and using es6 classes in anything but `new` statements
         * identity-mapping of callbacks
            * `removeEventListener` etc.
            * `reselect`, React's `useCallback` and probably many more caching functionality (does not break things)
      * partial solution: Use a separate map to track callbacks and their points of passage instead?
         * => Won't work as comprehensively at all
         * Cannot accurately track how callbacks were passed when executing them without it really; can only guess several possibilities
         * identity-tracking functions breaks with wrapper functions, as well as `bind`, `call`, `apply` etc...
            * => Same issue as with passing callbacks in React
         * We cannot capture all possible calls using instrumentation, since some of that might happen in black-boxed modules
* [loops]
   * fix `DoWhileLoop` :(
* [generators]
   * not done yet :(
* [async_runs]
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
* fix: trace order for `super` instrumentation is incorrect
   * try to find `SequenceExpression` ancestor first, and isntrument that instead
* fix: `StaticTrace.staticContextId`
   * generally less accurate than `trace.context.staticContextId`
   * cannot work correctly with interruptable functions
   * -> repurpose as `realStaticContextId`?
* fix: `NewExpression` is not properly instrumented
   * because our `callback` wrapping is too aggressive; won't work with babel es6 classes and breaks object identity
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
* [interactive_mode]
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
* [instrumentation] proper `cli`
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

