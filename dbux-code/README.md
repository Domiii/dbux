[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![https://marketplace.visualstudio.com/items?itemName=Domi.dbux-code](https://vsmarketplacebadge.apphb.com/version/Domi.dbux-code.svg)](https://marketplace.visualstudio.com/items?itemName=Domi.dbux-code)
[![install count](https://vsmarketplacebadge.apphb.com/installs-short/Domi.dbux-code.svg)](https://marketplace.visualstudio.com/items?itemName=Domi.dbux-code)
[![Discord](https://img.shields.io/discord/743765518116454432.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/QKgq9ZE)

# Installation

You can one-click install the plugin from the [VSCode marketplace](https://marketplace.visualstudio.com/items?itemName=Domi.dbux-code). You can also install it from within VSCode via the "Extensions" panel.

[You can learn more about Dbux here](https://github.com/Domiii/dbux).


# Usage

In order to analyze your JavaScript program, 

## "Run with Dbux" and "Debug with Dbux"

* The "Run with Dbux" button is located at the top of the "Applications" view
   * NOTE: You have to move mouse over it to see it. That's a VSCode limitation.
   * The button calls the "*Dbux: Run current file*" command.
* The "Debug with Dbux" button does the same thing as the Run button but with `--inspect-brk` enabled.
   * Make sure to turn on VSCode's Auto Attach for this.
   * For more information, consult [the official manual on "Node.js debugging in VS Code"](https://code.visualstudio.com/docs/nodejs/nodejs-debugging).
* When you click either button (or run the command), [@dbux/cli](../dbux-cli) will run the currently selected JS file (with the [@dbux/runtime](../dbux-runtime) injected), tracing out and recording all kinds of runtime information as it executes.
   * NOTE: Architectural details are explained [here](../#architectural-notes).
* You can configure both buttons in your workspace or user settings. See [Configuration](#configuration) for more details.



# Analyzing our program's Runtime

This extension provides the following views to engage in JavaScript runtime analysis:

## "Applications" treeview

Allows you to manage (enable/disable) all Dbux-enabled JavaScript applications that you ran.

* A new application will show up, once the first batch of an executed program's runtime data has been received.


## Code decorations

* Code that you ran with Dbux will be rendered with decorations.
* You can toggle in-code decorations via the `Hide Decorations` and `Show Decorations` commands.


## "Trace Details" treeview
Analyze and navigate individual traces.

* When looking


## "Call Graph" webview
Bird's Eye overview over all executed files and functions.


## The "Practice" treeview

* currently hidden behind a command
* uses `dbux-projects` to allow practicing dbux and, more generally, debugging on real-world projects and their bugs.



# Commands

How to execute VSCode commands:
1. Press `CTRL/Command + Shift + P`
1. Search for a command... (just type)
1. Select the command (`Enter`)


A rough outline of (hopefully all) commands:

### Dbux: Run File
Runs the currently open file with Dbux enabled.

### Dbux: Debug File
Runs the currently open file with Dbux enabled and Node's `--inspect-brk` turned on.

NOTE: Make sure to enable [VSCode's Auto Attach](https://code.visualstudio.com/docs/nodejs/nodejs-debugging#_auto-attach-feature) or attach a debugger manually (e.g. via an [`attach` launch option](https://code.visualstudio.com/docs/editor/debugging#_launch-versus-attach-configurations) or `chrome://inspect`) after running the command.

### Dbux: Export application data
Select and save an application as a JSON file.

### Dbux: select trace
Select trace by application name and traceId.

### Dbux: Call Graph
Open Dbux Call Graph.

### Dbux: Show decorations
Show decorations in file.

### Dbux: Hide all decorations
Hide decorations in file.

### Dbux: Toggle all navigation buttons
Show/Hide all Dbux's buttons on the upper right corner.

### Dbux: Toggle all error log
Show/Hide all Dbux's error messages.

### Dbux Practice: Cancel All
Stop activating bug.



# Configuration

These are all currently supported configuration parameters (mostly surrounding the "Run with Dbux" and "Debug with Dbux" buttons):

(You can open configuration via `CTRL/Command + Shift + P` -> "Open ... Settings")

```json
"dbux.run.enable-source-maps": {
   "type": "boolean",
   "default": true,
   "description": "Toggle `--enable-source-maps` (since, despite its usefulness, it can be super slow)",
   "scope": "resource"
},
"dbux.run.dbuxArgs": {
   "type": "string",
   "default": "",
   "description": "Custom `dbux run` command options. You can find a list of all available dbux command options in https://github.com/Domiii/dbux/ blob/master/dbux-cli/src/commandCommons.js",
   "scope": "resource"
},
"dbux.run.nodeArgs": {
   "type": "string",
   "default": "",
   "description": "Custom node options passed to node when running the program.",
   "scope": "resource"
},
"dbux.run.programArgs": {
   "type": "string",
   "default": "",
   "description": "Custom program arguments, available to the program via `process.argv`.",
   "scope": "resource"
},
"dbux.run.env": {
   "type": "object",
   "default": {},
   "description": "Custom program environment variables available via `process.env` (probably not working yet).",
   "scope": "resource"
},
"dbux.debug.enable-source-maps": {
   "type": "boolean",
   "default": false,
   "description": "Toggle `--enable-source-maps` (since, despite its usefulness, it can be super slow)",
   "scope": "resource"
},
"dbux.debug.dbuxArgs": {
   "type": "string",
   "default": "",
   "description": "Custom `dbux run` command options. You can find a list of all available dbux command options in https://github.com/Domiii/dbux/ blob/master/dbux-cli/src/commandCommons.js",
   "scope": "resource"
},
"dbux.debug.nodeArgs": {
   "type": "string",
   "default": "",
   "description": "Custom node options passed to node when running the program.",
   "scope": "resource"
},
"dbux.debug.programArgs": {
   "type": "string",
   "default": "",
   "description": "Custom program arguments, available to the program via `process.argv`.",
   "scope": "resource"
},
"dbux.debug.env": {
   "type": "object",
   "default": {},
   "description": "Custom program environment variables available via `process.env` (probably not working yet).",
   "scope": "resource"
}
```
