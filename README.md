[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![https://marketplace.visualstudio.com/items?itemName=Domi.dbux-code](https://vsmarketplacebadge.apphb.com/version/Domi.dbux-code.svg)](https://marketplace.visualstudio.com/items?itemName=Domi.dbux-code)
[![install count](https://vsmarketplacebadge.apphb.com/installs-short/Domi.dbux-code.svg)](https://marketplace.visualstudio.com/items?itemName=Domi.dbux-code)
[![Discord](https://img.shields.io/discord/743765518116454432.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/QKgq9ZE)
[![David](https://flat.badgen.net/david/dev/Domiii/dbux)](https://david-dm.org/Domiii/dbux?type=dev)

# Introduction

Dbux aims at helping analyze the execution of JavaScript programs by recording (almost) all runtime data, visualizing it and making it interactive, thereby (hopefully) helping developers (i) improve program comprehension and (ii) reduce time spent on finding bugs.

This (too long) video explains what Dbux is and features two examples of how to use the Dbux VSCode extension:

<a href="https://www.youtube.com/watch?v=m1ANEuZJFT8" target="_blank" alt="video">
   <img src="https://img.youtube.com/vi/m1ANEuZJFT8/0.jpg">
</a>

If you have any questions, feel free to [join us on DISCORD](https://discord.gg/QKgq9ZE).

# Getting Started

We recommend getting started with Dbux by playing around with the Dbux VSCode extension.

[These slides serve as an introduction and tutorial](https://docs.google.com/presentation/d/1-tFBB0afJl9PGSouEZyr3QIOV0ATyttUZVAjhOuW5iA/edit#slide=id.p) for `Dbux` + `Dbux Practice`.

The rest of this page covers several broad topics related to the Dbux project:

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Adding Dbux to Your Build Pipeline](#adding-dbux-to-your-build-pipeline)
- [Which files will be traced?](#which-files-will-be-traced)
- [Performance](#performance)
- [Known Limitations](#known-limitations)
  - [Loops](#loops)
  - [Other Syntax Limitations](#other-syntax-limitations)
  - [Problems with Values](#problems-with-values)
  - [Calling `process.exit` as well as uncaught exceptions are not always handled properly](#calling-processexit-as-well-as-uncaught-exceptions-are-not-always-handled-properly)
  - [Observer Effect](#observer-effect)
  - [`eval` and dynamically loaded code](#eval-and-dynamically-loaded-code)
  - [Function.prototype.toString and Function.name do not behave as expected](#functionprototypetostring-and-functionname-do-not-behave-as-expected)
  - [Issues on Windows](#issues-on-windows)
  - [SyntaxError: Unexpected reserved word 'XX'](#syntaxerror-unexpected-reserved-word-xx)
- [Dbux Data Analysis](#dbux-data-analysis)
- [Dbux Architecture](#dbux-architecture)
  - [Call Graph GUI Implementation](#call-graph-gui-implementation)
- [How is Dbux being used?](#how-is-dbux-being-used)
- [Development + Contributions](#development--contributions)
- [Future Work](#future-work)


# Adding Dbux to Your Build Pipeline

In order to analyze your program's runtime, your program must be instrumented with `@dbux/babel-plugin`, meaning that you need to "[babel](https://babeljs.io/) your program" with [@dbux/babel-plugin](dbux-babel-plugin#readme) enabled.

There are three approaches:

1. either: Use the [@dbux/cli](dbux-cli#readme) (command line interface)
   * It uses [@babel/register](https://babeljs.io/docs/en/babel-register) to instrument code on the fly.
   * This is also used by `Dbux VSCode Plugin`'s "Run with Dbux" button
   * [Read more here](dbux-cli#readme).
2. or: Add the [@dbux/babel-plugin](dbux-babel-plugin#readme) to your build pipeline manually
   * [Read more here](dbux-babel-plugin#readme).
3. `Dbux Practice` is integrated in the `Dbux VSCode Extension` and allows you to explore and debug several sample and real-world applications



Once running, the injected `@dbux/runtime` will send collected data to the runtime server inside the [Dbux VSCode extension](dbux-code#readme).


# Which files will be traced?

When running Dbux, most relevant parts of the code will be traced. However, tracing *everything* is very slow. That is why you want to fine-tune configuration as to what and how you want to trace. We currently offer several configuration options to that end in [moduleFilter](dbux-babel-plugin/src/external/moduleFilter.js), such as `packageWhitelist`, `packageBlacklist`, `fileWhitelist` and `fileBlacklist`.

We hope to provide better and more adaptive tracing for this [in the future](docs/future-work.md).


# Performance

There are many performance considerations in tracing and recording *all* activity of a program.

Main considerations include:

* Instrumentation can be slow.
  * `@dbux/cli` uses [`@babel/register`](https://babeljs.io/docs/en/babel-register) with custom caching. That caching currently has limited configuration, but we hope for more in the future.
  * If you use a bundler, make sure to configure caching for it.
* When executing *a lot of stuff* (e.g. long loops or high FPS games etc), things will get slow
  * For example: Dbux probably won't really work at all if you run it on a 30+FPS game.
    * In that case, we might want to be very strategic in telling Dbux to only record: (i) initialization, (ii) a select few other functions and then (iii) several frames of the gameloop for our analysis.
  * Again, adaptive tracing is something we want to do in the future.
* When running a program with Dbux enabled, and also running it in debug mode in Node (i.e. `--inspect` or `--inspect-brk`), things slow down even worse. When things get too slow, you might want to consider using the `Run` button instead of the `Debug` button, and use the Dbux built-in features for debugging; unless there are some features in the traditional debugger that you just cannot live without in some specific circumstances.
* Recording of large arrays and objects is limited, according to some (currently hardcoded) `SerializationLimits`, to be found in [valueCollection](dbux-runtime/src/data/valueCollection.js).


# Known Limitations

## Loops

Loop comprehension is currently limited.

Tracked in [#222](https://github.com/Domiii/dbux/issues/222).


## Other Syntax Limitations

The following JS syntax constructs are not supported at all or support is limited.

* Generator functions
  * Untested and not properly traced.
* Some es6 features are traced correctly, but data flow analysis is limited.
  * We do not currently connect data flow through es6 deconstruction.
  * In verbose mode, `Dbux` raises some warnings tagged with "`[NYI]`" to notify you of those missing connections.

NOTE: Most of these features still work fine, but some related information is not available and data flow analysis is interrupted.


## Problems with Values

Because of [performance](#performance) reasons, we cannot record *everything*.

* Big objects, arrays and strings are truncated (see [performance](#performance) for more information).
* We currently do not properly trace all built-ins. Tracked in https://github.com/Domiii/dbux/issues/543.


## Calling `process.exit` as well as uncaught exceptions are not always handled properly

* You might see a message along the lines of "`Process shutdown but not all data has been sent out. Analysis will be incomplete. This is probably because of a crash or process.exit was called manually.`"
* `process.exit` and uncaught exceptions kill the process, even if not all recorded data has been sent out yet. As a result, not all runtime data could be recorded properly. That is why Dbux tries to stall upon process.exit and uncaught exceptions and also issues a warning.
  * NOTE: some frameworks that kill your process by can be configured not to do so (e.g. for `Mocha` you want to add the `--no-exit` flag).
* This was tracked in [#201](https://github.com/Domiii/dbux/issues/201).


## Observer Effect

By trying to observe a program, while not intending to, you will inevitably change its behavior due to the [observer effect](https://en.wikipedia.org/wiki/Observer_effect_(physics)). Here are a few examples:

* Property getters with [side effects](https://softwareengineering.stackexchange.com/questions/40297/what-is-a-side-effect) will be called automatically by `Dbux` (to get all that juicy runtime data) and potentially break things
   * Dbux tracks data in real-time, by reading and recording variables, objects, arrays etc.
   * It also reads all (or at least many) properties of objects, thereby unwittingly causing property side-effects.
   * Examples:
      * `class A { count = 0; get x() { return ++this.count; } }; const a = new A();`
         * When Dbux reads `x` (when tracing the constructor call) it will unwittingly change `this.count`.
      * `const o = { get z() { console.log('z called'); return 42; } }`
         * When Dbux reads `z`, and you will see an unwanted "z called" in your console.
   * The only way to prevent these bugs is (currently) by writing side-effect-free getters (in most cases, getters are supposed to be side-effect-free anyway).
* [Proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
   * As explained in the previous point, [@dbux/runtime](dbux-runtime] iterates over and collects values of object properties automatically in its quest for gathering runtime data.
   * As discussed [here](https://stackoverflow.com/questions/36372611/how-to-test-if-an-object-is-a-proxy), [Proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) are transparent by design; meaning there is no general way to determine if something is a proxy or not.
   * At the same time, Proxy property access, also very much by design, often has side effects.
   * -> This means that in many scenarios where Proxies (with side effects) are in play, you might just not be able to use Dbux properly.

You can completely disable tracing of any sensitive AST nodes by preceding them with a `/* dbux disable */` comment. Tracked in issue [#209](https://github.com/Domiii/dbux/issues/209).

## `eval` and dynamically loaded code

As a general rule of thumb - Any dynamically loaded code will currently not be traced. That is because we are not proactively scanning the application for code injections or outside code references.

This includes:

* Calling `eval` on non-instrumented code
* Any kind of `<script>` tags containing or referencing non-instrumented code

* If it is not generated dynamically: instrument that code beforehand.
* If the code is generated dynamically, Dbux cannot be of help right now, as we would have to ship and inject `@dbux/babel-plugin` dynamically. While this is not impossible, it is not at all a priority to us. Contact us if you really need this to work.


## Function.prototype.toString and Function.name do not behave as expected

Because we instrument the function body, and sometimes even change the structure of functions, to allow better tracing their behavior, their `myFunc.toString()` is not what you expect it to be. `name` on the other hand should always survive (or so we hope).

This is only of concern to those who rely on serializing and deserializing functions, e.g. for sending functions of to run in a `webworker` ([related discussion here](https://stackoverflow.com/questions/11354992/why-cant-web-worker-call-a-function-directly)).

## Issues on Windows

* A bug unrelated to Dbux occurs **very rarely**, when running things in VSCode's built-in terminal: it might change `require` or `import` paths to lower- or upper-case drive letter.
   * NOTE: Luckily, we have not seen this bug occur in quite some time.
   * The bug causes a mixture of lower-case and upper-case drive letters to start appearing in `require` paths
      * => this makes `babel` unhappy ([github issue](https://github.com/webpack/webpack/issues/2815))
   * Official bug report: https://github.com/microsoft/vscode/issues/9448
   * Workaround: Restart your computer (can help!), run command in external `cmd` or find a better behaving shell/terminal.

## SyntaxError: Unexpected reserved word 'XX'

* Example: When just running `var public = 3;` in `node` or the browser, you don't get an error. However when running the same code with [@dbux/cli](dbux-cli#readme) (which is also invoked when pressing the `Dbux VSCode Plugin`'s "Run with Dbux" button), it throws a synxtax error.
* That is because:
   1. `public` (and others) are reserved keywords and using reserved keywords is only an error in **strict mode** ([relevant discussion here](https://stackoverflow.com/questions/6458935/just-how-reserved-are-the-words-private-and-public-in-javascript)).
   2. [@dbux/cli](dbux-cli#readme) uses [@babel/register](https://babeljs.io/docs/en/babel-register) with a bunch of default settings.
   3. By default, babel treats js files as [ESModules](https://nodejs.org/api/esm.html) (or `esm`s), and ESModules have strict mode enabled by default. This is also discussed here: https://github.com/babel/babel/issues/7910
   4. NOTE: You can see the same syntax error when slightly modifying above example and running it in `node` (without Dbux) but with strict mode enabled: `"use strict"; var public = 3;`.
* See "[Adding Dbux to your build pipeline](#adding-dbux-to-your-build-pipeline)" on how to customize the babel config


# Dbux Data Analysis

`@dbux/runtime` produces fine-grained JavaScript runtime data. If you are interested in analyzing this data programmatically, we currently provide two avenues to get started:

1. [@dbux/data](dbux-data#readme) is our main data processing JavaScript module. We use this to preprocess and manage all the data before visualizing it and making it interactive in the [Dbux VSCode Plugin](dbux-code#readme).
1. [analysis](analysis) contains a few Python functions and notebooks for rudimentary analysis on extracted data for testing and development purposes. We exported the data via the (also rather crude) [dbux.exportApplicationData command](dbux-code/src/codeUtil/codeExport.js). NOTE: This approach is a lot less mature and provides a lot less pre-built functionality than [@dbux/data](dbux-data#readme).

This feature is still at somewhat of an infant stage. We track related feedback in issue #208.

# Dbux Architecture

![architecture-v001](docs/img/architecture-v001.png)

This [monorepo](https://en.wikipedia.org/wiki/Monorepo) includes the following modules:

* [`@dbux/common`](dbux-common#readme) Collection of commonly used utilities shared among (more or less) all other modules.
* [`@dbux/common-node`](dbux-common-node#readme) Collection of commonly used utilities shared among (more or less) all node-only modules.
* [`@dbux/babel-plugin`](dbux-babel-plugin#readme) Instruments and injects `@dbux/runtime` into a given js program when supplied as a `plugin` to Babel.
* [`@dbux/runtime`](dbux-runtime#readme) When an instrumented program runs, this module is responsible for recording and sending runtime data to the `@dbux/data` module, running on a receiving server (using `socket-io.client`). [The Dbux VSCode plugin](dbux-code#readme) hosts such a server.
* [`@dbux/cli`](dbux-cli#readme) The cli (command-line interface) allows us to easily run a js program while instrumenting it on the fly using [@babel/register](https://babeljs.io/docs/en/babel-register).
* [`@dbux/data`](dbux-data#readme) Receives, pre-processes and manages all data sent by `@dbux/runtime`. It allows us to query and analyze JS runtime data on a higher level.
* [`dbux-code`](dbux-code#readme) The Dbux VSCode extension ([VSCode marketplace link](https://marketplace.visualstudio.com/items?itemName=Domi.dbux-code)).
* [`@dbux/practice`](dbux-projects#readme) Used by `dbux-code` (but does not depend on `VSCode`) to allow practicing Dbux (and, more generally) debugging concepts and strategies on real-world bugs inside of real-world open source projects.
* [`@dbux/graph-common`](dbux-graph-common#readme), [`@dbux/graph-client`](dbux-graph-client#readme) and [`@dbux/graph-host`](dbux-graph-host#readme) Are responsible for rendering and letting the user interact with the "Call Graph" through an HTML GUI.


## Call Graph GUI Implementation

(For learning how to use the Call Graph, please refer to the [Dbux VSCode Plugin documentation](dbux-code#call-graph).)

A few more notes on the Call Graph GUI implementation:

* The Call Graph view is an HTML gui, currently most prominently seen as the "Call Graph" window inside the [Dbux VSCode Plugin](dbux-code#readme).
* Inside of `dbux-code`, the graph is hosted in [GraphWebView](dbux-code/src/graphView/GraphWebView.js), but you could also host it independently on a website, in an iframe etc.
* The Call Graph consists of three modules [`@dbux/graph-common`](dbux-graph-common#readme), [`@dbux/graph-client`](dbux-graph-client#readme) and [`@dbux/graph-host`](dbux-graph-host#readme).
* Client and host are running in separated runtimes, and they share the graph-common module for any code sharing between the two.
* We developed an IPC-first component system to easily render things on the client, while allowing us to control it from the host.
* `client` and `host` communicate via a supplied `IpcAdapter` which must provide two functions (whose implementation depends on the environment that they run in): `onMessage` and `postMessage`.


# How is Dbux being used?

* [dbux-practice](dbux-projects#readme) (still in development) aims to make it very easy for anyone to practice/improve their debugging skills by training on real-world bugs in pre-configured environments featuring popular open source software.
* This [proxy-play](https://github.com/Domiii/proxy-play) experiment acts as a proxy to inject Dbux into all scripts of any website, before they execute in the browser, thereby allowing to analyze any website's scripts with Dbux.


(NOTE: Dbux only went public in Sept 2020. We expect this list to grow over time.)


# Development + Contributions

If you are interested in Dbux development, feel free to take a look at [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).


# Future Work

We keep track of some of our big ideas in [docs/future-work.md](docs/future-work.md).
