[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![https://marketplace.visualstudio.com/items?itemName=Domi.dbux-code](https://vsmarketplacebadge.apphb.com/version/Domi.dbux-code.svg)](https://marketplace.visualstudio.com/items?itemName=Domi.dbux-code)
[![](https://vsmarketplacebadge.apphb.com/installs-short/Domi.dbux-code.svg)](https://marketplace.visualstudio.com/items?itemName=Domi.dbux-code)
[![David](https://flat.badgen.net/david/dev/Domiii/dbux)](https://david-dm.org/Domiii/dbux?type=dev)


# Introduction

Dbux aims at visualizing the JS runtime and making it interactive, hopefully helping developers improve (i) program comprehension and (ii) debugging.

Here is a (very very early, read: crude) 1min demo video of just a small subset of the features:

<a href="https://www.youtube.com/watch?v=VAFcj75-vSs" target="_blank" alt="video">
   <img src="http://img.youtube.com/vi/VAFcj75-vSs/0.jpg">
</a>

# Using the Dbux VSCode Plugin

Please see [dbux-code](dbux-code).

# Adding Dbux to your build pipeline

TODO


# Development + Contributions

Please see [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).


# Known Issues & Limitations

##### Calling `process.exit` as well as uncaught exceptions are not handled properly
* You might see a message along the lines of "Process shutdown but not all data has been sent out. Analysis will be incomplete. This is probably a crash or you called `process.exit` manually." in the console.
* `process.exit` and uncaught exceptions kill the process, even if not all recorded data has been sent out yet, as a result, you won't see all traces/contexts etc.
* If you *MUST* call `process.exit`, consider doing it after a `setTimeout` with 0.5-1s delay to be on the safe side.
   * NOTE: some frameworks that kill your process allow disabling that (e.g. `Mocha`'s `--no-exit` argument)
* This is tracked in #201.

#### Heisenbugs
By trying to observe a program, you will inevitably change its behavior leading to the [observer effect](https://en.wikipedia.org/wiki/Observer_effect_(physics)) leading to [heisenbugs](https://en.wikipedia.org/wiki/Heisenbug).

* Impure property getters will be called by `dbux` (to get all that juicy runtime data) and potentially break things
   * dbux tracks data in real-time, by reading variables, objects, arrays etc.
   * It also reads all (or at least many) properties of objects, thereby unwittingly causing side-effects when any property is an impure getter
   * e.g. `class A { count = 0; get x() { return ++this.count; } }; const a = new A(); // dbux will read x when tracing the constructor call, and thus unwittingly change count`
      * -> In this case, dbux will certainly break your program, or at the very least your count will be off
   * e.g. `const o = { get z() { console.log('z called'); return 42; } } // dbux will read z and you will see an unwanted "z called" in your console, probably rendering the user confused`
   * -> The good news is that you can prevent this by not writing impure getters (in most cases, getters are supposed to be pure)!
* Proxies and other custom object getters with side effects
   * As explained in the previous point, the `dbux-runtime` iterates over object properties
   * Proxies are by design transparent. I.e. you cannot use any code to determine if something is a proxy or not. Proxies have some nasty getters that, also very much by design, are very likely to be impure. We cannot prevent calling those impure getters (for now).
   * -> This means that in many scenarios where proxies are in play, you might just not be able to use dbux properly.

#### `eval`'ed code will not be traced
* Any dynamically executed code will currently not be traced.
* Same goes for dynamically inserted dynamic HTML `<script>` tags.

#### Issues under Windows
* **sometimes**, when running things in VSCode built-in terminal, it might change to lower-case drive letter
   * This causes a mixture of lower-case and upper-case drive letters to start appearing in `require` paths
      * => this makes `babel` unhappy ([github issue](https://github.com/webpack/webpack/issues/2815))
   * Official bug report: https://github.com/microsoft/vscode/issues/9448
   * Solution: Restart your computer (can help!), run command in external `cmd` or find a better behaving terminal


#### SyntaxError: Unexpected reserved word 'XX'
* Example: When just running `var public = 3;` in `node` or the browser, you don't get an error. However when running the same code with [@dbux/cli](dbux-cli) (which is also invoked when pressing the "Run" button), it bugs out.
   * You can see the same problem when slightly modifying above example and running it in `node` without dbux enabled: `"use strict"; var public = 3;`
* That is because:
   1. `public` (and others) are reserved keywords ([relevant discussion here](https://stackoverflow.com/questions/6458935/just-how-reserved-are-the-words-private-and-public-in-javascript))
   1. [@dbux/cli](dbux-cli) uses [@babel/register](https://babeljs.io/docs/en/babel-register) with a bunch of default settings.
   1. By default, babel treats js files as es modules, and es modules have strict mode enabled by default. This is also discussed here: https://github.com/babel/babel/issues/7910
* In the future, you should be able to customize the babel config and disable strict mode if you please. However we recommend to just work in strict mode to begin with.


# Architectural Notes

This is a multi-module monorepo with the following modules:

1. [`dbux-common`](dbux-common) Collection of commonly used utilities shared among (more or less) all other modules.
1. [`dbux-babel-plugin`](dbux-babel-plugin) Instruments the program and injects `dbux-runtime` when supplied as a `plugin` to Babel.
1. [`dbux-runtime`](dbux-runtime) When an instrumented program runs, the runtime is used to record and send runtime data to the `dbux-data` on a receiving server (using `socket-io.client`).
1. [`dbux-cli`](dbux-cli) The cli (command-line interface) allows us to easily run a js program while instrumenting it on the fly using [@babel/register](https://babeljs.io/docs/en/babel-register).
1. [`dbux-data`](dbux-data) Receives, pre-processes and manages all data sent by `dbux-runtime` to any consumer. It provides the tools to easily query and analyze the js runtime data received from `dbux-runtime`.
1. [`dbux-code`](dbux-code) The [dbux VSCode extension](https://marketplace.visualstudio.com/items?itemName=Domi.dbux-code), which you can install in VSCode with one click.
1. [`dbux-projects`](dbux-projects) Used by `dbux-code` (while not dependending on `VSCode`) to allow practicing dbux (and debugging in general) on real-world bugs inside of real-world open source projects.
1. [`dbux-graph-common`](dbux-graph-common), [`dbux-graph-client`](dbux-graph-client) and [`dbux-graph-host`](dbux-graph-host) Are responsible for rendering and interacting with the "Call Graph" in HTML.
   * Inside of `dbux-code`, the graph is hosted in [GraphWebView](dbux-code/src/graphView/GraphWebView.js), but we can also host it independently on a website, in an iframe etc.
   * `client` and `host` communicate via a supplied `IpcAdapter` which in turn has two functions: `onMessage` and `postMessage`.

![architecture-v001](docs/img/architecture-v001.png)

