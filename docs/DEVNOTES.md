Random collection of stuff:


# VSCode: Tips + Tricks

* General references
   * https://vscodecandothat.com/
   * https://medium.com/club-devbytes/how-to-use-v-s-code-like-a-pro-fb030dfc9a72

* Use VSCode as git diff tool
   * [see here](https://stackoverflow.com/a/47569315)

* Keyboard shortcuts
   * NOTE: VSCode's Terminal/DebugConsole/Output windows often have no keybinding to "Clear" stuff. You have to add that manually:
      1. CTRL+SHIFT+P -> "Open Keyboard Shortcuts (JSON)"
      1. Add:
         * MAC
            ```json
            {
               "key": "cmd+k",
               "command": "workbench.debug.panel.action.clearReplAction",
               "when": "inDebugRepl"
            },
            {
               "key": "cmd+k",
               "command": "workbench.output.action.clearOutput",
               "when": "activePanel == 'workbench.panel.output'"
            },
            {
               "key": "cmd+k",
               "command": "workbench.action.terminal.clear",
               "when": "terminalFocus"
            }
            ```
         * Windows
            ```json
            {
               "key": "ctrl+k",
               "command": "workbench.action.terminal.clear",
               "when": "terminalFocus"
            },
            {
               "key": "ctrl+k",
               "command": "workbench.debug.panel.action.clearReplAction",
               "when": "inDebugRepl"
            },
            {
               "key": "ctrl+k",
               "command": "workbench.output.action.clearOutput",
               "when": "activePanel == 'workbench.panel.output'"
            }
            ```


# Some of the more annoying problems that have already been resolved (before we started using Github issues)

* `Socket.IO` depends on `uws` which is deprecated
   * fix: tell webpack to ignore it, since by default its not being used
   * see: https://github.com/socketio/engine.io/issues/575
   * see: https://github.com/socketio/socket.io/issues/3342
   * see: https://github.com/mmdevries/uws
* `socket.io-client` bugs out because `ws` is bundled as targeting browser
   * `code-insiders .\dbux-runtime\node_modules\engine.io-client\lib\transports\websocket.js`
* Babel Config pain
   * [how to use Babel 7 babel-register to compile files outside of working directory #8321](https://github.com/babel/babel/issues/8321)
   * https://github.com/babel/babel/pull/5590
