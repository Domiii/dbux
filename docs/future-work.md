# Future Work

This file serves to keep track of features that could prove very valuable for runtime analysis and debugging purposes. 
So many things that can be done... So little time...

* more advanced search/filter features, such a...
  * searching for arrays/objects that contain certain values
  * searching/filtering of/by all (or subset of) `node_modules`, package names
  * enabling/disabling/grouping of/by modules/files etc. in call graph
  * searching/filtering only system calls or sub-systems (e.g. all `HTTP` calls)
* Explore execution by all module/package and/or their dependencies
* Support web-based VSCode https://vscode.dev/
* Support [Yarn PnP](https://yarnpkg.com/features/pnp)


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