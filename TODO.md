
# TODO

## TODO (dbux-code + dbux-data; high priority)
* [applicationDisplayName]
   * find unique key of 'entryPointPath' of all selectedApplications
      * do while selectedApplicationChanged (in _notifyChanged)
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

## TODO (dbux-code + dbux-data; lower priority)
* [UI design]
   * good icons + symbols in all tree nodes
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
* [await instrumentation]
   * test: when error thrown, pop the right resume context, and also await context if necessary?
* `tracesAtCursor`
   * remove this view, replace with button at the top left
   * select most relevant trace only
   * difficult
      * e.g. in async functions -> latest trace is `Resume` trace, not necessarily inner most (e.g. argument) trace
      * select "closest trace"
* keep testing navigation in todomvc (especially: moving from event handler to store methods)
* [callbacks]
   * Problem: we cannot wrap callbacks, as it will break the function's (or class's) identity.
      * NOTE: This breaks identity-mapping functions, caching, triggers a babel assertion when targeting esnext and trying to instantiate a wrapped class, and `instanceof`, to name a few
      * Solution: Use a separate map to track callbacks and their points of passage instead?
* [instrumentation]
   * [loops]
      * capture loop variables in BlockStart
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
* [values]
   * track function parameters
   * track `this`
   * better overall value rendering
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
* [CodeTreeWrapper]
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
* serialize/deserialize all data, survive VSCode restart/reload


## Fancy ideas (Dev)
* add extra-watch-webpack-plugin https://github.com/pigcan/extra-watch-webpack-plugin?



# Tools for Call Graph Analysis

## Call Graph Roots
* (mostly done)

## Call Graph Paths
* Given two traces, find shortest path (or path that is most likely to be the actual path?)
   * TODO: Somehow visualize and allow interactions with that path
      * -> Possibly like a car navigation system -> listing all the twists and turns
* Given some trace, find trace (and path) that has shortest path of all traces at given staticTrace (selected at cursor)
* 

### Future work
* Given some un-traced code, find potential path to that trace?
   * TODO: Requires Ai + static analysis