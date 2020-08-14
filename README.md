[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![https://marketplace.visualstudio.com/items?itemName=Domi.dbux-code](https://vsmarketplacebadge.apphb.com/version/Domi.dbux-code.svg)](https://marketplace.visualstudio.com/items?itemName=Domi.dbux-code)
[![install count](https://vsmarketplacebadge.apphb.com/installs-short/Domi.dbux-code.svg)](https://marketplace.visualstudio.com/items?itemName=Domi.dbux-code)
[![Discord](https://img.shields.io/discord/743765518116454432.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/bdD3yH)
[![David](https://flat.badgen.net/david/dev/Domiii/dbux)](https://david-dm.org/Domiii/dbux?type=dev)

# TOC<!-- omit in toc -->

1. [Introduction](#introduction)
2. [Using Dbux](#using-dbux)
3. [Adding Dbux to your build pipeline](#adding-dbux-to-your-build-pipeline)
4. [Programmatic Data Analysis](#programmatic-data-analysis)
5. [Known Issues & Limitations](#known-issues--limitations)
   1. [Calling `process.exit` as well as uncaught exceptions are not handled properly](#calling-processexit-as-well-as-uncaught-exceptions-are-not-handled-properly)
   2. [Heisenbugs](#heisenbugs)
   3. [`eval` (or any dynamically loaded code) will not be traced](#eval-or-any-dynamically-loaded-code-will-not-be-traced)
   4. [SyntaxError: Unexpected reserved word 'XX'](#syntaxerror-unexpected-reserved-word-xx)
   5. [Issues under Windows](#issues-under-windows)
6. [Architectural Notes](#architectural-notes)
   1. [Call Graph](#call-graph)
7. [Development + Contributions](#development--contributions)

# Introduction

Dbux aims at visualizing the JS runtime and making it interactive, hopefully helping developers improve (i) program comprehension and (ii) debugging.

If you have any questions or are interested in the progress of this project, feel free to [join us on DISCORD](https://discord.gg/bdD3yH).

Here is a (very very early, read: crude) 1min demo video of just a small subset of the features:

<a href="https://www.youtube.com/watch?v=VAFcj75-vSs" target="_blank" alt="video">
   <img src="http://img.youtube.com/vi/VAFcj75-vSs/0.jpg">
</a>

# Using Dbux

The easiest way to start with Dbux is through the [Dbux VSCode Plugin](dbux-code#readme).

NOTE: [Dbux VSCode Plugin](dbux-code#readme) is also (currently) the only frontend for Dbux. So even if you follow the steps below, you are likely going to need it, unless you want to perform [Programmatic Data Analysis](#programmatic-data-analysis) on the resulting data sets.

While you definitely want to get started with the VSCode plugin, you might encounter scenarios where the "Run" buttons are not enough anymore. In that case you might have to manually inject the [@dbux/babel-plugin](dbux-babel-plugin#readme), which is explained in the next section.


# Adding Dbux to your build pipeline

In order to analyze you runtime, your program must be instrumented with Dbux and injected with the [@dbux/runtime](dbux-runtime#readme). [@dbux/babel-plugin](dbux-babel-plugin#readme) is responsible for both, meaning you need to "[babel](https://babeljs.io/) your program" with [@dbux/babel-plugin](dbux-babel-plugin#readme) enabled.

There are two primary ways:

1. Use the [@dbux/cli](dbux-cli#readme) (command line interface) which in turn uses [@babel/register](https://babeljs.io/docs/en/babel-register) to instrument code on the fly. [Read more here](dbux-cli#readme).
1. Add the [@dbux/babel-plugin](dbux-babel-plugin#readme) (IMPORTANT: as the **last** entry in your `plugins` array) to your build pipeline manually. [Read more here](dbux-babel-plugin#readme).


# Programmatic Data Analysis

[@dbux/runtime] produces fine-grained JavaScript runtime data. If you are interested in applying programmatic data analysis on this data, we currently provide two avenues to get started:

1. [@dbux/data](dbux-data#readme) is the JavaScript module we also use internally to preprocess and manage all the data before visualizing it and making it interactive in the [Dbux VSCode Plugin](dbux-code#readme).
1. [analysis](analysis) contains a few Python notebooks for rudimentary analysis on extracted data for testing and development purposes. We exported the data via the (also rather crude) [dbux.exportApplicationData command](dbux-code/src/codeUtil/codeExport.js). NOTE: This is a lot less mature than [@dbux/data](dbux-data#readme).

Since this is still at somewhat of an infant stage, we want to gather feedback related to this feature in issue #208.


# Known Issues & Limitations

## Calling `process.exit` as well as uncaught exceptions are not handled properly

* You might see a message along the lines of "Process shutdown but not all data has been sent out. Analysis will be incomplete. This is probably a crash or you called `process.exit` manually." in the console.
* `process.exit` and uncaught exceptions kill the process, even if not all recorded data has been sent out yet, as a result, you won't see all traces/contexts etc.
* If you *MUST* call `process.exit`, consider doing it after a `setTimeout` with 0.5-1s delay to be on the safe side.
   * NOTE: some frameworks that kill your process allow disabling that (e.g. `Mocha`'s `--no-exit` argument)
* This is tracked in #201.


## Heisenbugs

By trying to observe a program, while definitely not intending to, you will inevitably change its behavior leading to the [observer effect](https://en.wikipedia.org/wiki/Observer_effect_(physics)) leading to [heisenbugs](https://en.wikipedia.org/wiki/Heisenbug). Here are a few already known sources for Heisenbugs:

* Property getters with [side effects](https://softwareengineering.stackexchange.com/questions/40297/what-is-a-side-effect) will be called automatically by `Dbux` (to get all that juicy runtime data) and potentially break things
   * Dbux tracks data in real-time, by reading variables, objects, arrays etc.
   * It also reads all (or at least many) properties of objects, thereby unwittingly causing side-effects of any property.
   * e.g. `class A { count = 0; get x() { return ++this.count; } }; const a = new A(); // dbux will read x when tracing the constructor call, and thus unwittingly change count`
      * -> In this case, dbux will certainly break your program, or at the very least your count will be off
   * e.g. `const o = { get z() { console.log('z called'); return 42; } } // dbux will read z and you will see an unwanted "z called" in your console, probably rendering the user confused`
   * -> The good news is that you can prevent this by writing side-effect-free getters (in most cases, getters are supposed to be side-effect-free)!
* Proxies
   * As explained in the previous point, [@dbux/runtime](dbux-runtime] iterates over and collects values of object properties automatically in its quest for gathering runtime data.
   * As discussed [here](https://stackoverflow.com/questions/36372611/how-to-test-if-an-object-is-a-proxy), [Proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) are transparent by design. I.e. there is no general way to determine if something is a proxy or not.
   * At the same time, Proxy property access, also very much by design, often has side effects.
   * -> This means that in many scenarios where Proxies (with side effects) are in play, you might just not be able to use Dbux properly.

NOTE: There are ways to avoid these issues, for example by allowing in-line comment directives (like Eslint), but we sadly just don't have that yet. Tracked in issue #209.


## `eval` (or any dynamically loaded code) will not be traced

As a general rule of thumb - Any dynamically loaded code will currently not be traced. That is because we are not currently proactively scanning the application for code injections or outside code references.

Affected examples include:

* Any instance of `eval` with non-instrumented code
* Any kind of &lt;script> tags containing or referencing non-instrumented code

In order to trace such code, the runtime would have to:

1. (Probably) delay execution of the new piece of code
2. "Babel the code" with @dbux/babel-plugin enabled.
3. Replace the code with the instrumented version
4. Resume.

While this is not impossible, we certainly do not currently support this feature.


## SyntaxError: Unexpected reserved word 'XX'

* Example: When just running `var public = 3;` in `node` or the browser, you don't get an error. However when running the same code with [@dbux/cli](dbux-cli#readme) (which is also invoked when pressing the "Run" button), it throws a synxtax error.
* That is because:
   1. `public` (and others) are reserved keywords and using reserved keywords is only an error in **strict mode** ([relevant discussion here](https://stackoverflow.com/questions/6458935/just-how-reserved-are-the-words-private-and-public-in-javascript)).
   2. [@dbux/cli](dbux-cli#readme) uses [@babel/register](https://babeljs.io/docs/en/babel-register) with a bunch of default settings.
   3. By default, babel treats js files as [ESModules](https://nodejs.org/api/esm.html) (or `esm`s), and ESModules have strict mode enabled by default. This is also discussed here: https://github.com/babel/babel/issues/7910
   4. NOTE: You can see the same syntax error when slightly modifying above example and running it in `node` (without Dbux) but with strict mode enabled: `"use strict"; var public = 3;`.
* You should be able to customize the babel config and disable strict mode if you please. However we recommend to just work against strict mode to begin with.


## Issues under Windows

* An entirely unrelated bug occurs **very rarely**, when running things in VSCode's built-in terminal, it might change to lower-case drive letter.
   * NOTE: Luckily, we have not seen this bug occur in quite some time.
   * This causes a mixture of lower-case and upper-case drive letters to start appearing in `require` paths
      * => this makes `babel` unhappy ([github issue](https://github.com/webpack/webpack/issues/2815))
   * Official bug report: https://github.com/microsoft/vscode/issues/9448
   * Solution: Restart your computer (can help!), run command in external `cmd` or find a better behaving terminal



# Architectural Notes

This is a multi-module monorepo including the following modules:

1. [`@dbux/common`](dbux-common#readme) Collection of commonly used utilities shared among (more or less) all other modules.
1. [`@dbux/babel-plugin`](dbux-babel-plugin#readme) Instruments the program and injects `@dbux/runtime` when supplied as a `plugin` to Babel.
1. [`@dbux/runtime`](dbux-runtime#readme) When an instrumented program runs, the runtime is used to record and send runtime data to the `@dbux/data` on a receiving server (using `socket-io.client`).
1. [`@dbux/cli`](dbux-cli#readme) The cli (command-line interface) allows us to easily run a js program while instrumenting it on the fly using [@babel/register](https://babeljs.io/docs/en/babel-register).
1. [`@dbux/data`](dbux-data#readme) Receives, pre-processes and manages all data sent by `@dbux/runtime` to any consumer. It provides the tools to easily query and analyze the js runtime data received from `@dbux/runtime`.
1. [`dbux-code`](dbux-code#readme) The Dbux VSCode extension ([VSCode marketplace link](https://marketplace.visualstudio.com/items?itemName=Domi.dbux-code)). You can also install it from within VSCode via the "Extensions" panel.
1. [`@dbux/projects`](dbux-practice#readme) Used by `@dbux/code` (while not dependending on `VSCode`) to allow practicing dbux (and debugging in general) on real-world bugs inside of real-world open source projects.
1. [`@dbux/graph-common`](dbux-graph-common#readme), [`@dbux/graph-client`](dbux-graph-client#readme) and [`@dbux/graph-host`](dbux-graph-host#readme) Are responsible for rendering and interacting with the "Call Graph" in HTML.

![architecture-v001](docs/img/architecture-v001.png)


## Call Graph

A few more notes on the Call Graph implementation:

* The Call Graph view is an HTML gui, currently most prominently seen as the "Call Graph" window inside the [Dbux VSCode Plugin](dbux-code#readme).
* Inside of `@dbux/code`, the graph is hosted in [GraphWebView](dbux-code/src/graphView/GraphWebView.js), but you could also host it independently on a website, in an iframe etc.
* It consists of three modules [`@dbux/graph-common`](dbux-graph-common#readme), [`@dbux/graph-client`](dbux-graph-client#readme) and [`@dbux/graph-host`](dbux-graph-host#readme).
* Client and host are running in separated runtimes, and they share the graph-common module for any code sharing between the two.
* We developed an IPC-first component system to easily render things on the client, while allowing us to control it from the host.
* `client` and `host` communicate via a supplied `IpcAdapter` which must provide two functions (whose implementation depends on the environment that they run in): `onMessage` and `postMessage`.


# Development + Contributions

If you are interested in Dbux development and maybe even want to participate or contribute, please see [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).