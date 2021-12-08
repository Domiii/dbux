[![https://marketplace.visualstudio.com/items?itemName=Domi.dbux-code](https://vsmarketplacebadge.apphb.com/version/Domi.dbux-code.svg)](https://marketplace.visualstudio.com/items?itemName=Domi.dbux-code)
[![install count](https://vsmarketplacebadge.apphb.com/installs-short/Domi.dbux-code.svg)](https://marketplace.visualstudio.com/items?itemName=Domi.dbux-code)
[![Discord](https://img.shields.io/discord/743765518116454432.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/QKgq9ZE)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

This page explains the dbux-code extension and how to use it. For more general information regarding Dbux, check out [our git repository](https://github.com/Domiii/dbux/tree/master/#readme).

<h2>Table of Contents</h2>

- [Introduction w/ Examples](#introduction-w-examples)
- [Installation](#installation)
- [Usage](#usage)
- ["Run with Dbux" and "Debug with Dbux"](#run-with-dbux-and-debug-with-dbux)
  - [How the Run + Debug buttons work](#how-the-run--debug-buttons-work)
- [Analysis Features](#analysis-features)
  - [Applications](#applications)
  - [Code decorations](#code-decorations)
  - [Trace Selection](#trace-selection)
  - [Trace Details](#trace-details)
  - [Trace Details: Navigation](#trace-details-navigation)
  - [Trace Details: Value](#trace-details-value)
  - [Trace Details: Object Traces](#trace-details-object-traces)
  - [Trace Details: Trace Executions](#trace-details-trace-executions)
  - [Trace Details: Nearby Values](#trace-details-nearby-values)
  - [Trace Details: Debug](#trace-details-debug)
  - [Call Graph](#call-graph)
  - [Call Graph: pause (pause/resume live updates)](#call-graph-pause-pauseresume-live-updates)
  - [Call Graph: clear (show/hide already recorded traces)](#call-graph-clear-showhide-already-recorded-traces)
  - [Call Graph: sync (toggle sync mode)](#call-graph-sync-toggle-sync-mode)
  - [Call Graph: loc](#call-graph-loc)
  - [Call Graph: call](#call-graph-call)
  - [Call Graph: Search](#call-graph-search)
  - [Finding Errors](#finding-errors)
- [Practice debugging with "Dbux Practice"](#practice-debugging-with-dbux-practice)
- [Commands](#commands)
- [Configuration](#configuration)
- [Dbux Runtime Server](#dbux-runtime-server)
- [How does Dbux work?](#how-does-dbux-work)

# Introduction w/ Examples

This video explains what Dbux is and features **two examples** of how to use the Dbux VSCode extension:

<a href="https://www.youtube.com/watch?v=m1ANEuZJFT8" target="_blank" alt="video">
   <img src="https://img.youtube.com/vi/m1ANEuZJFT8/0.jpg">
</a>

# Installation

You can one-click install the plugin from the [VSCode marketplace](https://marketplace.visualstudio.com/items?itemName=Domi.dbux-code). You can also install it from within VSCode via the "Extensions" panel.

[You can learn more about Dbux here](https://github.com/Domiii/dbux/tree/master/).


# Usage

In order to get started, you probably want to use the "Run with Dbux" button on some JavaScript program.

Once your program has run, you can analyze it in great detail, as described below.

If you have a build pipeline, and cannot just run it via `node myProgram.js`, refer to "[Adding Dbux to your build pipeline](https://github.com/Domiii/dbux/tree/master/#adding-dbux-to-your-build-pipeline)".

Dbux is not perfect. You might want to read up on [known limitations](https://github.com/Domiii/dbux/tree/master/#known-limitations).


# "Run with Dbux" and "Debug with Dbux"

The "Run with Dbux" button is the easiest way to get started with Dbux
* It is located in multiple places:
   1. In the top right (to the right of your editor tabs)
   2. In the Dbux view container at the top of the "Applications" view
      * NOTE: You have to move mouse over it to see it. That's a VSCode limitation.
   3. In the Dbux view container at the top of the "Trace Details" view
      * NOTE: You have to move mouse over it to see it. That's a VSCode limitation.
* The button calls the "*Dbux: Run current file*" command (which you can keybind if you want)

The "Debug with Dbux" button does the same thing as the Run button but with `--inspect-brk` enabled.

* Make sure to turn on VSCode's Auto Attach for this.
* For more information on VSCVode debugging, consult [the official manual on "Node.js debugging in VS Code"](https://code.visualstudio.com/docs/nodejs/nodejs-debugging).

## How the Run + Debug buttons work

* When you click either button (or use the "*Dbux: Run/Debug current file*" commands), what happens is: [@dbux/cli](https://github.com/Domiii/dbux/tree/master/dbux-cli) runs the currently open JS file (with the [@dbux/runtime](https://github.com/Domiii/dbux/tree/master/dbux-runtime) injected), tracing and recording runtime information as it executes.
* You can configure both buttons in your workspace or user settings. See [Configuration](#configuration) for more details.
* NOTE: Dbux architectural details are explained [here](https://github.com/Domiii/dbux/tree/master/#dbux-architecture).


# Analysis Features

This extension provides the following visual aids and interactions to engage in JavaScript runtime analysis:

## Applications

The "Applications" view is at the top of the Dbux view.

* This allows you to manage (enable/disable) all Dbux-enabled JavaScript applications.
   * A new application will show up, once the first batch of an executed program's runtime data has been received.
   * Executions of the same entry point file will be grouped together, and replace one another, when a new execution comes along.
* You can click an application to enable/disable it.
   * Disabled applications will not be visible to inspection. Only enabled applications:
      1. Render [code decorations](#code-decorations)
      1. Allow [trace selection](#trace-selection)
      1. Show up in the [Call Graph](#call-graph)
* Activating multiple applications at once can be useful for full-stack debugging purposes.
   * When multiple applications are running at the same time, their Call Graphs will be (crudely) merged and can be viewed as one.


## Code decorations

* Code that you ran with Dbux will be rendered with decorations.
* These decorations allow us to better understand which parts of the code actually executed.
* You can toggle these decorations via the `Dbux: Hide Decorations` and `Dbux: Show Decorations` commands.
* Some explanations:
   * `f()`<span style="color:red">↱</span> is a *traced* function call: the function `f` is recorded and we can step into it
   * `g()` <span style="color:gray">↱</span> is a library or native call: the function `g` is not recorded and we cannot step into it
   * For all code decorations and their meanings, please refer to [dbux-code/src/codeDeco/traceDecoConfig.js](https://github.com/Domiii/dbux/tree/master/dbux/src/codeDeco/traceDecoConfig.js)

Examples:

* In this buggy code, we find that line 6 never executed, just from the code decorations:
   ![code-deco1](https://domiii.github.io/dbux/docs/img/code-deco1.png)


## Trace Selection

![select trace](https://domiii.github.io/dbux/docs/img/select-trace1.gif)

* Code that has executed can be traced and analyzed. Executed code can be distinguished from code that did not execute from [code decorations](#code-decorations) (if enabled).
* To select a trace, place the keyboard cursor on executed code and press the "Select Trace" button.
   * NOTE: Keywords like `if` and `return` cannot currently be selected, however their conditions/arguments can.
* Press repeatedly to select surrounding traces (as shown in the gif above).

## Trace Details

Analyze and navigate through individual traces:

## Trace Details: Navigation

Navigation allows you to step through all recorded traces, similar to (but more advanced than) stepping in a traditional debugger. Navigation works by continuously updating "the currently selected trace".

![navigation](https://domiii.github.io/dbux/docs/img/nav1.png)

Important: The buttons will only show up if you select them, or hover over them with the mouse (again, this is a VSCode limitation).

Note that we are not debugging in real-time, but work on a recoding of the actual execution, allowing us to...

1. step forward and also *backward* in time, meaning that all navigation modes exist twice (one forward, one backward).
2. more easily (to some extent) take smarter (i.e. slightly less stupid) steps than the default debugger

Here are all the buttons:

<img src="https://domiii.github.io/dbux/dbux-code/resources/dark/previousParentContext.png" title="previousParentContext" height="24px" width="24px" style="background-color: #1A1A1A"> <img src="https://domiii.github.io/dbux/dbux-code/resources/dark/nextParentContext.png" title="nextParentContext" height="24px" width="24px" style="background-color: #1A1A1A">  `Go to start/end of context`

* Jump to the start/end of the current [context](https://github.com/Domiii/dbux/tree/master/#context) (function or file)
* When pressed again, steps out to caller (which we also call "parent")

<img src="https://domiii.github.io/dbux/dbux-code/resources/dark/previousChildContext.png" title="previousChildContext" height="24px" width="24px" style="background-color: #1A1A1A"> <img src="https://domiii.github.io/dbux/dbux-code/resources/dark/nextChildContext.png" title="nextChildContext" height="24px" width="24px" style="background-color: #1A1A1A"> `Go to previous/next function call in context`

* Jump to previous/next *traced* function call (red <span style="color:red">↱</span>) before/after the currently selected trace.
   * Note that library or native calls (gray <span style="color:gray">↱</span>) are not traced and thus will be skipped by this button.
* When pressed again, steps into that function (aka [context](https://github.com/Domiii/dbux/tree/master/#context) aka "child context of this context").
* NOTE: Things might be a bit off in case of [getters and setters](https://www.w3schools.com/js/js_object_accessors.asp)
   * Getters and setters work, but navigation is a bit less intuitive.
   * Since getters and setters don't have a clearly identifyable caller trace, they will need some more development work before they will be fully smoothed out.

<img src="https://domiii.github.io/dbux/dbux-code/resources/dark/previousInContext.png" title="previousInContext" height="24px" width="24px" style="background-color: #1A1A1A"> <img src="https://domiii.github.io/dbux/dbux-code/resources/dark/nextInContext.png" title="nextInContext" height="24px" width="24px" style="background-color: #1A1A1A"> `Go to previous/next "non-trivial" trace in context`

* Jump to previous/next "non-trivial" trace in [context](https://github.com/Domiii/dbux/tree/master/#context) (function or file)
* Stepping would be a lot of work, if we tried to step through every single expression.
* That is why Dbux uses some basic heuristics to ignore some of the more "trivial traces".
   * Ex1: In case of `a.b`, it will step to `a.b`, but it will not step to `a`.
   * Ex2: In case of `o.f(x, y);`, it will step straight to `o.f(x, y)`, while ignoring `o`, `o.f`, `x` and `y` (all four of which are also all traced expressions, just a bit more "trivial" than the call expression itself).
* (Dev note: we internally determine "trivial traces" as traces of `TraceType.ExpressionValue`.)


<img src="https://domiii.github.io/dbux/dbux-code/resources/dark/previousStaticTrace.png" title="previousStaticTrace" height="24px" width="24px" style="background-color: #1A1A1A"> <img src="https://domiii.github.io/dbux/dbux-code/resources/dark/nextStaticTrace.png" title="nextStaticTrace" height="24px" width="24px" style="background-color: #1A1A1A"> `Go to previous/next execution of the same trace`

* If a piece of code was executed multiple times (because a function was called multiple times, or there is a loop etc), these buttons allow you to jump between the traces of those different executions.
* These buttons step through all [`Trace Executions`](#trace-executions) of the currently selected `trace`'s `staticTrace`. [Read more on Dbux terminology here](https://github.com/Domiii/dbux/tree/master/#trace)


<img src="https://domiii.github.io/dbux/dbux-code/resources/dark/leftArrow.png" title="previous" height="24px" width="24px" style="background-color: #1A1A1A"> <img src="https://domiii.github.io/dbux/dbux-code/resources/dark/rightArrow.png" title="next" height="24px" width="24px" style="background-color: #1A1A1A"> `Go to previous/next trace (unconditionally)`

* Go to previous/next trace, no matter what. This navigation method does not filter out "trivial traces", and it also moves in and out of contexts, if that is where the previous/next trace is.
* These buttons provide the most granular navigation option.
* Recommendation:
   * Use these buttons if you want to follow the exact control flow of your program, visiting every expression and statement, not ignoring anything; especially useful for convoluted one-liners or otherwise compressed, complex expressions and statements that are not intuitive to disentangle.
   * Only use these buttons for short distances, as there is usually a lot of trivial traces to step through, slowing navigation down a lot.



## Trace Details: Value

If your currently selected trace is an expression with a value that is `!== undefined`, that value will be rendered here.

You can investigate further by clicking on the "Value" node.

Further reading:
   * Dbux's [value limitations and problems](https://github.com/Domiii/dbux/tree/master/#problems-with-values).

![value](https://domiii.github.io/dbux/docs/img/values.gif)


## Trace Details: Object Traces

Lists all occurences of an object and allows us to track its evolution throughout the execution of the application, like in the example below.

Specifically: if the currently selected trace's value is an object (or non-primitive), `Object Traces` will list all traces of values that are equal to that value ("equal" as defined by [JavaScript's built-in `Map`'s key equality algorithm](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#Key_equality)).

There is a "Highlight in Call Graph" button that appears when hovering over the "Object Traces" node, at the right-hand side. It expands and highlights all contexts where this object was used in the call graph.

![object traces](https://domiii.github.io/dbux/docs/img/object-traces.gif)


## Trace Details: Trace Executions

Lists the values of all executions of the currently selected "piece of code".

E.g. if you currently selected some trace `f(x)`, then you would see all executions (and their values) of `f(x)` here.

You can select (jump to) any trace inside of this list by clicking on it.

Since this can be a lot of traces, you can group them by different criteria through a button on the `Trace Executions` node.
* NOTE: Again, you have to move mouse over it to see it. That's a VSCode limitation.

Another way of putting this is: `Trace Executions` lists all `traces` of the currently selected `trace`'s `staticTrace`. [Read more on Dbux terminology here](https://github.com/Domiii/dbux/tree/master/#trace)

![trace executions](https://domiii.github.io/dbux/docs/img/trace-executions-hof1.png)


## Trace Details: Nearby Values

`Nearby Values` lists *all* traces of the current [context](https://github.com/Domiii/dbux/tree/master/#context) (function or file) that are expressions and whose value is not `undefined`.

You can select (jump to) any trace inside of this list by clicking on it.

We want to add some grouping to this feature. That is being worked on and tracked [here](https://github.com/Domiii/dbux/tree/master/dbux/issues/264).

**Recommendations**: `Nearby Values` is very useful to...

* understand which values were generated in what order.
* decipher complex one-liners (see screen grab below).

![nearby values](https://domiii.github.io/dbux/docs/img/nearby-values.png)

## Trace Details: Debug

This renders raw data related to the selected trace.

This is generally only useful for contributors, the very curious or those who work on dynamic JS runtime data analysis.

## Call Graph

The <img src="https://domiii.github.io/dbux/dbux-code/resources/dark/call-graph.png" title="call graph" height="24px" width="24px" style="background-color: #1A1A1A"> Call Graph renders a bird's eye overview over all executed files and functions.

As an analogy, I would say that the call graph is like (a rather crude) "Google Maps" while the [trace details view](#trace-details) is (a rather crude) "Google Street View" of your application's execution. Together they offer a multi-resolutional interactive tool to see and find everything that is going on in your application.

The timeline expands vertically, while execution depth goes into the horizontal.

At the outer most level, you see individual "[Run](https://github.com/Domiii/dbux/tree/master/#run)" nodes.

Each "Run" contains all (visible/recorded) "[Context](https://github.com/Domiii/dbux/tree/master/#context)" sub trees, that is all invocations of traced functions and files.

Call graph visualizations have many uses. E.g.:

* overview the complex system that is our application.
* quickly identify points of interests in code that is not our own.
* visualize [recursion trees](https://www.google.com/search?q=recursion+trees), like in the screengrab below

![call graph: fibonacci1](https://domiii.github.io/dbux/docs/img/call-graph-fib-1.png)

## Call Graph: pause (pause/resume live updates)

* Dbux keeps recording and rendering all code execution in real-time, as long as an application (or website) is running.
* During analysis, once we have recorded the bug (or other event of interest), we might not be interested in further updates.
* Use the 🔴 button to pause/resume the rendering of new incoming data, so we can focus on what we already have.
   * NOTE: You might be tempted into thinking that pausing with this button will stop all recording, however that is not what happens. Currently, Dbux keeps on recording for as long as the application is running. This button only hides that new data behind a single "Hidden Node". That inability to completely pause recording, can make things very slow and thus make debugging of games and other kinds of high performance applications very difficult. [You can read more about performance considerations here](https://github.com/Domiii/dbux/tree/master/#performance).


## Call Graph: clear (show/hide already recorded traces)

* The `x` button (`clear`) is useful for removing clutter when investigating a bug that does not appear immediately, or is not part of the initialization routine.
* For example, when investigating a bug that happens after pressing some button (a "buggy button" if you will) in your application, you can:
   1. wait for the application to finish initialization and for the "buggy button" to show up
   1. press `x`
   1. press your application's buggy button
   1. (if necessary) wait until the bug occurs
   1. press 🔴 (pause).
* -> This lets you completely isolate the code that was executed when clicking that button, render only the relevant sub graph, while removing (hiding) all kinds of unrelated clutter.


## Call Graph: sync (toggle sync mode)

`sync` mode makes sure that while you select traces in and navigate through your code, the selected trace's context is always automatically expanded and in clear sight inside the Call Graph view.


## Call Graph: loc

Show/hide locations in context nodes.

Clicking the location takes you there.

## Call Graph: call

Show/hide caller traces of all contexts that are function invocations.

You can click the call trace to go there. You can `CTRL/Command` + `Click` it to select it.

## Call Graph: Search

Simple text search. Currently only matches the context node's title (aka `staticTrace.displayName`).

Dev note: The search implementation is located in [dataProviderUtil.searchContexts](https://github.com/Domiii/dbux/tree/master/dbux-data/src/dataProviderUtil.js).

## Finding Errors

If a thrown error has been recorded, the "Error" button will show up at the top right in VSCode (to the right of the editor tabs).

When you click it, it takes you right to the error.

If there are multiple errors, it should take you to the first error in your program.

# Practice debugging with "Dbux Practice"

"Dbux Practice" aims to allow anyone to easily get into practicing debugging on real-world bugs in professionally developed open source projects.

We are still working on this. More on this soon :)


# Commands

**How to execute [VSCode commands](https://code.visualstudio.com/docs/getstarted/tips-and-tricks#_command-palette)?**

1. Press `CTRL/Command + Shift + P`
1. Search for a command... (type the name or some letters of the name)
1. Select the command (`Enter`)
1. See it execute.

You can bind commands to keys. [This official documentation explains how to easily keybind any command in VSCode](https://code.visualstudio.com/docs/getstarted/keybindings).

Note that many of the built-in Dbux buttons can also be controlled via commands.



A rough outline of (hopefully all) commands:

<!-- dbux:codeCommands start -->
| Command                                               | Title                                               | Description                                                                                                                                |
| ----------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| dbux.backendLogin                                     | Dbux: Backend Login                                 | (Feature still in development. Won't work.)                                                                                                |
| dbux.clearDBStats                                     | Dbux: Clear DB Stats                                |                                                                                                                                            |
| dbux.clearMemento                                     | Dbux: Clear Memento Storage                         |                                                                                                                                            |
| dbux.debugFile                                        | Dbux: Debug current file                            | Run selected file with Dbux, but with Node's `--inspect-brk` enabled. Make sure to enable VSCode's auto attach beforehand.                 |
| dbux.deleteUserEvents                                 | Dbux Dev: Delete all user events                    | (Feature still in development. Won't work.)                                                                                                |
| dbux.doActivate                                       | Dbux: Start Dbux                                    |                                                                                                                                            |
| dbux.exportApplicationData                            | Dbux: Export Application Data                       | Export raw recorded Dbux data of a previously executed application to a `json` file.                                                       |
| dbux.hideDecorations                                  | Dbux: Hide Code Decorations                         | Do not annotate executed code with Dbux code decorations (<span style='color:red'>✦↱</span><span style='color:orange'>🔥ƒ</span> etc).     |
| dbux.hideGraphView                                    | Dbux: Hide Call Graph                               | Close the Call Graph panel.                                                                                                                |
| dbux.hidePathwaysView                                 | Dbux: Hide Pathways View                            |                                                                                                                                            |
| dbux.importApplicationData                            | Dbux: Import Application Data                       |                                                                                                                                            |
| dbux.loadPracticeLogFile                              | Dbux Dev:Load Practice Log                          |                                                                                                                                            |
| dbux.openPracticeLogFolder                            | Dbux: Open Practice Log Folder                      |                                                                                                                                            |
| dbux.reloadExerciseList                               | Dbux: Reload Exercise List                          |                                                                                                                                            |
| dbux.resetPracticeLog                                 | Dbux Dev: Reset Practice Log                        |                                                                                                                                            |
| dbux.resetPracticeProgress                            | Dbux Dev: Reset Practice Progress                   |                                                                                                                                            |
| dbux.runFile                                          | Dbux: Run current file                              | Run selected file with Dbux                                                                                                                |
| dbux.selectTrace                                      | Dbux: Select Trace by id                            | Mostly used for debugging Dbux, or when (for some other reason) you would know some trace by its id.                                       |
| dbux.showDBStats                                      | Dbux: Show DB Stats                                 |                                                                                                                                            |
| dbux.showDecorations                                  | Dbux: Show Code Decorations                         | Show code decorations again after hiding them.                                                                                             |
| dbux.showGraphView                                    | Dbux: Show Call Graph                               | Open the Call Graph panel.                                                                                                                 |
| dbux.showHelp                                         | Dbux: Help                                          | Show the Dbux help dialog.                                                                                                                 |
| dbux.showMemento                                      | Dbux: View Memento Storage                          |                                                                                                                                            |
| dbux.showOutputChannel                                | Dbux: Show output channel                           |                                                                                                                                            |
| dbux.showPathwaysView                                 | Dbux: Show Pathways View                            |                                                                                                                                            |
| dbux.startRuntimeServer                               | Dbux: Start Dbux Runtime Server                     |                                                                                                                                            |
| dbux.stopRuntimeServer                                | Dbux: Stop Dbux Runtime Server                      |                                                                                                                                            |
| dbux.systemCheck                                      | Dbux: Check System Dependencies                     | Dbux (especially Dbux practice) needs some system tools in order to work properly. You can check these dependencies with this command.     |
| dbux.toggleErrorLog                                   | Dbux: Toggle Error Notifications                    | Suppress/unsuppress all Dbux error notifications.                                                                                          |
| dbux.toggleNavButton                                  | Dbux: Toggle Editor Buttons                         | Hide/show Dbux buttons in the editor tab bar. Use this if you don't want to see any extra buttons at the top right of your editor tab bar. |
| dbux.togglePracticeView                               | Dbux: Toggle Practice View                          | Feature still in development. You can use this to use Dbux on a pre-configured bug in express.                                             |
| dbuxProject.uploadLog                                 | Upload log files                                    |                                                                                                                                            |
| dbuxProjectView.showDiff                              | Show difference                                     |                                                                                                                                            |
| dbuxSessionView.flushCache                            | Dbux Project: Flush cache                           |                                                                                                                                            |
| dbuxSessionView.run                                   | Dbux Project: Run without dbux                      |                                                                                                                                            |
| dbuxSessionView.run#dbux                              | Dbux Project: Run with dbux                         |                                                                                                                                            |
| dbuxSessionView.run#debug                             | Dbux Project: Run without dbux in debug mode        |                                                                                                                                            |
| dbuxSessionView.run#debug#dbux                        | Dbux Project: Run with dbux in debug mode           |                                                                                                                                            |
| dbuxTraceDetailsView.navigation.NextChildContext      | Dbux: Go to next function call in context           |                                                                                                                                            |
| dbuxTraceDetailsView.navigation.NextInContext         | Dbux: Go to next "non-trivial" trace in context     |                                                                                                                                            |
| dbuxTraceDetailsView.navigation.NextParentContext     | Dbux: Go to end of context                          |                                                                                                                                            |
| dbuxTraceDetailsView.navigation.NextStaticTrace       | Dbux: Go to next execution of the same trace        |                                                                                                                                            |
| dbuxTraceDetailsView.navigation.NextTrace             | Dbux: Go to next trace (unconditionally)            |                                                                                                                                            |
| dbuxTraceDetailsView.navigation.PreviousChildContext  | Dbux: Go to previous function call in context       |                                                                                                                                            |
| dbuxTraceDetailsView.navigation.PreviousInContext     | Dbux: Go to previous "non-trivial" trace in context |                                                                                                                                            |
| dbuxTraceDetailsView.navigation.PreviousParentContext | Dbux: Go to start of context                        |                                                                                                                                            |
| dbuxTraceDetailsView.navigation.PreviousStaticTrace   | Dbux: Go to previous execution of the same trace    |                                                                                                                                            |
| dbuxTraceDetailsView.navigation.PreviousTrace         | Dbux: Go to previous trace (unconditionally)        |                                                                                                                                            |
| dbuxTraceDetailsView.selectTraceAtCursor              | Dbux: Select Trace At Cursor                        | Selects the trace at the keyboard cursor (if there is any executed trace).                                                                 |

<!-- dbux:codeCommands end -->

# Configuration

These are all currently supported configuration parameters (mostly for the "Run with Dbux" and "Debug with Dbux" buttons/commands):

(You can open configuration via `CTRL/Command + Shift + P` -> "Open {User,Workspace} Settings")

<!-- dbux:codeConfig start -->
| Entry                  | Type    | Default                                           | Description                                                                                                                                                               |
| ---------------------- | ------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| dbux.autoStart         | boolean | false                                             | Auto start Dbux when opening vscode                                                                                                                                       |
| dbux.run.dbuxArgs      | string  | <span style='white-space:nowrap;'>--esnext</span> | Custom `dbux run` command options. You can find a list of all available dbux command options in https://github.com/Domiii/dbux/blob/master/dbux-cli/src/commandCommons.js |
| dbux.run.nodeArgs      | string  | --enable-source-maps                              | Custom node options passed to node when running the program.                                                                                                              |
| dbux.run.programArgs   | string  |                                                   | Custom program arguments, available to the program via `process.argv`.                                                                                                    |
| dbux.run.env           | object  | {}                                                | Custom program environment variables available via `process.env` (probably not working yet).                                                                              |
| dbux.debug.dbuxArgs    | string  | <span style='white-space:nowrap;'>--esnext</span> | Custom `dbux run` command options. You can find a list of all available dbux command options in https://github.com/Domiii/dbux/blob/master/dbux-cli/src/commandCommons.js |
| dbux.debug.nodeArgs    | string  |                                                   | Custom node options passed to node when running the program.                                                                                                              |
| dbux.debug.programArgs | string  |                                                   | Custom program arguments, available to the program via `process.argv`.                                                                                                    |
| dbux.debug.env         | object  | {}                                                | Custom program environment variables available via `process.env` (probably not working yet).                                                                              |
| dbux.packageWhitelist  | string  |                                                   | Specify which package will be traced by Dbux, seperated by space, regex supported.                                                                                        |

<!-- dbux:codeConfig end -->



# Dbux Runtime Server

The 📡 runtime server is hosted by the Dbux VSCode extension to receive runtime data reported by @dbux/runtime. It automatically turns on the first time you start using Dbux from the extension GUI.

If you want to invoke Dbux independently, make sure to press the button in the "Applications" view to start the server (if not started already).

# How does Dbux work?

Please refer to the [main page](https://github.com/Domiii/dbux/tree/master/#readme) for more information on how Dbux works, how to configure it, performance considerations and more.
