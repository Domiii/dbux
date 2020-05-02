
# TODO

## TODO (shared)
* [Projects]
   * show status of runner while runner is running
      * -> need to add event listener to runner for that
   * add buttons:
      * "select bug"
      * "delete project"
      * "cancel" (calls `BugRunner.cancel()`)
* in `traceDetails`: change 6 navigation buttons to buttons inside a single node (horizontal instead of vertical)
* when clicking error button: call `reveal({focus: true})` on `CallRootsView`
* when selecting a trace:
   * if previously selected trace is not under cursor:
      * first find the inner-most `staticTrace` at cursor, and start from that
   * else: keep switching through all possible traces under cursor
* add files to `ApplicationsView`
   * list all files as children for each application
      * click:
         * if not open: open file -> then go to first trace in file
         * if open: just open (don't go to trace)
   * group all "previous runs" under a "(previous runs)" node


* add a command to toggle (show/hide) all intrusive features
   * includes:
      * show/hide all `codeDeco`s
      * show/hide all other buttons in the top right
   * command name: `Dbux: Toggle Controls`
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












## TODO (dbux-graph)
* `ContextNode`:
   * remove `shift+click`
   * replace it by clicking on the title (`displayName`) element instead (make it a `<a>`)
* `GraphNode`
   * apply `GraphNode` controller pattern to all "graph node" components: `Run`, `GraphRoot`
   * add "contractAllButThis" button to `GraphNode`
   * add `reveal` function to `host/GraphNode`:
      * make sure, all contracted parents change to `ExpandChildren`
      * slide to node
      * highlight node
* fix: require `alt` for `pan` (else button clicks don't work so well)
   * e.g. `nodeToggleBtn` does not work when clicking too fast and slightly moving the mouse
* `ContextNode`
   * link/label: parentTrace
      * traceLabel + valueLabel
      * remove `ParentTraces` from `TraceMode` enum (adding an extra node for each unnecessary due to its 1:1 relationship with `context`)
* highlight system: highlight *important* nodes, de-emphasize *unimportant* nodes
   * highlight mode examples
      * `context` of currently selected `trace`
      * all contexts of `staticContext`
      * all traces of `staticTrace`
      * search mode: highlight nodes that match search criteria
   * styles
      * highlighted style
         * scale font, normal font-size
         * clear, bright colors
         * high contrast
      * de-emphasized style
         * don't scale font, small font-size
         * darkened colors
         * low contrast
* grouping: add new `GroupNode` controller component
   * `ContextGroupNode`: more than one `context`s (`realContext`) of `parentTraceId`
   * `RecursionGroupNode`: if we find `staticContext` repeated in descendant `context`s
      * (e.g. `next` in `express`)
* add a css class for font scaling (e.g. `.scale-font`): when zooming, font-size stays the same
   * NOTE: can use `vh` instead of `px` or `rem` (see: https://stackoverflow.com/questions/24469375/keeping-text-size-the-same-on-zooming)
* "trace <-> context mode" switch per node (and maybe sub-tree); not for entire graph
* replace bootstrap with [something more lightweight](https://www.google.com/search?q=lightweight+bootstrap+alternative)
* `ContextNode`
   * link/label: filename:lineNumber
      * TODO: for all filenames of same application, we want to remove `commonPrefix`
         1. store `commonPrefix`
         2. when seeing new `StaticProgramContext` in DataProvider, extract `commonPrefix`
            -> if first time or if `commonPrefix` is shorter than before, update `commonPrefix` of all files
               (maybe send out an event to update GUI? maybe not necessary...)
            -> else, only set `commonPrefix` for new files (before adding)
* NOTES
   * `render` does NOT propagate to children (unlike React)











## TODO (`dbux-projects`)
* basic functionality:
   * auto-commit
   * cancel
   * uninstall
* find a workaround for test timeout?
   * testing often comes with timeout (e.g. "Error: timeout of 2000ms exceeded")
      * nothing was received because of error
      * can we try this outside extension host etc to speed up process?
      * add `signal-exit`? https://www.npmjs.com/package/signal-exit
   * check: does this still occur, even with `--no-exit`?
* fix: what to do when switching between bugs but installation (or user) modified files?
   * NOTE: switching between bugs requires `git checkout` which needs local changes to be committed or reset
   * auto `commit` and forget?
* make sure, express works:
   * run it in dbux
   * switch between bugs
   * run again
   * cancel
* make sure, switching between multiple projects works
   * (add eslint next?)
* load bugs from bug database automatically?
* replace `callbackWrapper` with improved function tracking instead
   * track...
      * function declarations (even non-statement declaration)
      * Context `push`
      * CallExpression `callee`
      * any function value
   * provide improved UI to allow tracking function calls
* fix up serializer
* auto attach is not working
* project state management?
   * `new Enum()`

* [UI]
   * list projects
   * list bugs of each project
   * show/hide/clear log
   * project
      * -> `openInEditor` (see `externals.editor`)
         * if first install, ask user if they want to add project folder to workspace?
   * bug
      * -> `openInEditor` (see `externals.editor`)
   * manage `bugRunner` state + progress?
   * manage `running` bugs/tests

   * save changes to patch file before moving to another bug?
* file management
   * asset folder?
   * target folder?
   * allow target folder to be configurable


* [Deployment]
   * need to further install dependencies (e.g. `babel` etc.) in order to run anything

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
* test logger floodgate mechanism
* fix: object tracking
   * catch + floodgate errors thrown in object getters
   * make sure `express` runs
* fix: function names
   * get all names during a preliminary run, then do instrumentation on second
* fix: `traveValueLabels`
   * get callee name from instrumentation
   * good traceValueLabel for all expressions
* `dbux-graph`
   * add `HostComponentEndpoint.getController/s`
      * -> look up controller(s) by type; works similar to Unity's `GetComponent/s`
   * pass down context
      * have `GraphRoot` and `Run` add themselves to the context
      * have `ContextNode` register by app+id
      * add `GraphRoot.getContextNode(context)`
* define clear list of features
   * write 3 minimal user stories per feature (applied to a specific bug somewhere)
   * also demonstrate each feature on express
      * TODO: find express bugs related to features that are commonly used
* fix: instrumentation order
   * for `CallExpression`, manually start visit to `callee` first
   * hardcode mixed `TraceType`s (`Throw/Return` + `Await/Call/Function`)
   * test combinations with functions
      * odd one out: `return await function f() {}`
* fix: more instrumentation order problems
   * Problem: `guessFunctionName`: `[cb] [cb] (unnamed)`
   * Problem: `throw` is not traced (`error1`)
   * Problem: in `o.f()` trace, `o` has a higher `traceId` than `o.f()`'s `BCE`
* allow for mixed type objects for object tracking
   * in `express`, `application` object is also a function
   * need to allow "objectified functions" to be displayed as such
   * Problem: How to determine what is an "objectified function"?
      * -> `Object.keys` is not empty
* fix: in `a.b.c`, only `a.b` is traced?
* fix: in `console.log(a.b.c);`, `a` is not traced
* fix: `CallExpression`, `Function`, `Await` have special interactions
   * they all might be children of other visitors
   * NOTE: currently all other visitors use `wrapExpression`
      * -> checks `isCallPath` and has special handling only for that
      * -> Problem: come up with comprehensive conflict resolution here
         * `CallExpression`: `traceReturnType` controlled if `return` or `throw`
         * `Function`: no wrapping for functions
         * `Await`: `resumeTraceId` is `TraceType.Resume`, but can also be `ReturnArgument` or `ThrowArgument`?
      * -> Problem: how to let a trace play multiple different roles?
   * (finish: child visitor queue)
   * patch babel-traverse (to support non-type-based visitors):
      1. [context.shouldVisit](https://github.com/babel/babel/blob/a34424a8942ed7346894e5fd36dc1490d4e2190c/packages/babel-traverse/src/context.js#L25)
      2. [traverse.node](https://github.com/babel/babel/blob/master/packages/babel-traverse/src/index.js#L59)
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

* [errors] false positive:
   * e.g. `if (val === 'new') return next('route');`
   * e.g. ```
   exports.deprecate = function(fn, msg){
      if (process.env.NODE_ENV === 'test') return fn;
      // prepend module name
      msg = 'express: ' + msg;`
   ```
* fix: small trace odities
   * when selecting a traced "return", it says "no trace at cursor"
      * (same with almost any keywords for now)
   * `if else` considers `else` as a block, and inserts (potentially unwanted) code deco
* `displayName` is often too long for proper analysis in py/callGraph
   * -> do not add source code of function itself -> change to `cb#i of A.f` instead
* [serialization]
   * early accessing of getters can cause exceptions and maybe worse
* fix: setup `eslint` to use correct index of `webpack` multi config to allow for `src` alias
   * Problem: won't work since different projects would have an ambiguous definition of `src`
* test: 
   * `throw await x;`
   * `return await x;`
   * `o[await x]`
      * -> problem: `awaitVisitor` and `returnVisitor`/`memberExoression visitor` at odds?
   * `f(a, await b, c)`
      * -> probably won't work, because `resolveCallIds` would try to resolve results too fast
* fix: provide an easier way to use `ipynb` to analyze any application
* dbux-graph web components
   * map data (or some sort of `id`) to `componentId`
   * batch `postMessage` calls before sending out
   * write automatic `dbux-graph-client/scripts/pre-build` component-registry script

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

