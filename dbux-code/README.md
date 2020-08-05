VSCode extension for Dbux. 

NOTE: This project is currently in ALPHA stage, and we do not recommend anyone using it quite yet, without having contacted us or participated in our workshops or online classes first. We are still working on making it more accessible, in order to, ultimately, unleash the power of advanced debugging and program comprehension strategies + tools to everyone!

See https://github.com/Domiii/dbux for more info.


## Commands

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
