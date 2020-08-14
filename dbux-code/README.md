# Installation

You can one-click install the plugin from the [VSCode marketplace](https://marketplace.visualstudio.com/items?itemName=Domi.dbux-code). You can also install it from within VSCode via the "Extensions" panel.

[You can learn more about Dbux here](https://github.com/Domiii/dbux).


# Usage

1. Open some JavaScript (*.js) file
1. Run with Dbux
   * Use the "Dbux: Run current file" command, or...
   * Press the "Run" button in the top right, or...
   * Find the same button on top of the Applicatons view
      * NOTE: In VSCode, in-view buttons are not visible unless you hover over the corresponding GUI element


TODO: Make a short video

# "Run with Dbux"

* The "Run with Dbux" button is located at the top of the "Applications" view
   * NOTE: You have to move mouse over it to see it. That's a VSCode limitation.
* When you click the button, [dbux-cli](../dbux-cli) will run the file with the [dbux-runtime](../dbux-runtime) injected.
   * NOTE: Architectural details are explained [here](../#architectural-notes).


# Analyzing our program's Runtime

Currently, the dbux-code extension provides the following views to engage in JavaScript runtime analysis:

## "Applications" treeview
Allows you to manage (enable/disable) all Dbux-enabled JavaScript applications that you ran.

* A new application will show up, once the first batch of an executed program's runtime data has been received.


## "Trace Details" treeview
Analyze and navigate individual traces.

* When looking


## "Call Graph" webview
Bird's Eye overview over all executed files and functions.


## The "Practice" treeview (currently hidden behind a command) uses `dbux-projects` to allow practicing dbux and, more generally, debugging on real-world projects and their bugs.


# Commands

A rough outline of (hopefully all) commands:

### Dbux: Run File
Runs the currently open file with Dbux enabled.

### Dbux: Debug File
Runs the currently open file with Dbux enabled with `--inspect-brk`.

NOTE: Make sure to enable [VSCode's Auto Attach](https://code.visualstudio.com/docs/nodejs/nodejs-debugging#_auto-attach-feature) or attach a debugger manually (e.g. via an [`attach` launch option](https://code.visualstudio.com/docs/editor/debugging#_launch-versus-attach-configurations) or `chrome://inspect`) after running the command.

### Dbux Projects: Cancel All
Stop activating bug.

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
