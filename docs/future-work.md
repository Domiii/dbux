# Future Work

This file serves to keep track of features that could prove very valuable for runtime analysis and debugging purposes. 
So many things that can be done... So little time...

* Typescript support
* Remote capabilities
  * NOTE: `@dbux/runtime` is currently hardcoded to connect to a `localhost` server (see [here](C:\Users\domin\code\dbux\dbux-runtime\src\client\Client.js)).
* Properly test and provide recipes for all environments, e.g.:
  * Node's `vm` (Jest uses that also)
  * `WebWorker`
  * `WebContainer`
  * more...
* Advanced dynamic runtime adaptive recording, to reduce noise and improve performance.
  * Currently, a loop of 1 million iterations already stretches Dbux to its limits. We want to improve that.
  * Adaptive trace logging would be advantageous: 
    * (i) only log traces that are "relevant", and (ii) allow user to easily select or change what is "relevant".
* Config file support for instrumentation + `runtime`.
* Configurable stats display for `CallGraph` stats (see `ContextNode._addStats`)
* Proper `stats` screen where one can easily analyze all kinds of program execution statistics
* More advanced search/filter analysis features, such as...
  * searching for arrays/objects that contain certain values
  * searching/filtering of/by all (or subset of) `node_modules`, package names
  * enabling/disabling/grouping of/by modules/files etc. in call graph
  * searching/filtering only system calls or sub-systems (e.g. all `HTTP` calls)
  * complex search queries (and, or, parentheses etc.)
* Analyze by module/files and along the dependency trees
* Support web-based VSCode https://vscode.dev/
* Support [Yarn PnP](https://yarnpkg.com/features/pnp)


# More Future Ideas

* advanced **context-sensitive** keymap support to expand/collapse/click all buttons (e.g. similar to [AOE4's "grid keys"](https://www.google.com/search?q=aoe4+grid+keys))
  * provide a single `Toggle Dbux Keymap` shortcut/command. When enabled:
  * show relevant shortcut key next to each button (if possible?)
  * `vscode.commands.executeCommand('setContext', 'dbux.keyboardMode.enabled', true);`
  ```jsonc
  { "keybindings": [
    {
      "command": "dbux.selectTrace",
      "key": "q",
      "when": "dbux.keyboardMode.enabled"
    },
    // ...
    { 
      // this command toggle expands/collapses the first "expandable" button of TraceDetails (usually `Value`)
      "command": "dbux.traceDetails.btns.toggle.first"
      // ...
    },
    // ...
    { 
      // this command clicks the first "meaningfully clickable" button of TraceDetails (which is the first navigation button?)
      "command": "dbux.traceDetails.btns.click.first"
      // ...
    }
  ]}
  ```