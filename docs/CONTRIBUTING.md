# Code of Conduct

TODO: we are still working on this

# Joining the Community

While you can certainly try to get started on your own, you probably make your life a lot easier by [join the dev team on Discord](https://discord.gg/8kR2a7h) first :)


# Development + Contributing: Getting Started

## Prerequisites

* bash
   * On Windows, you can get this via cygwin or `git` (which also installs cygwin)
* node
   * we recommend [v12.12.0](https://nodejs.org/en/blog/release/v12.12.0/) or higher for its source map support
* vscode
* yarn


## Setup

```sh
git clone https://github.com/Domiii/dbux.git
cd dbux
code dbux.code-workspace # open project in vscode
npm run dbux-install
```

if dependencies bug out, run the (very aggressive) clean-up command: `npm run dbux-reinstall`


## Start development

1. Open project + start webpack
   ```sh
   code dbux.code-workspace # open project in vscode
   npm start # start webpack development build of all projects in watch mode
   ```
1. Go to your debug tab, select the `dbux-code` configuration and press F5 (runs dbux-code (VSCode extension) in debug mode)
1. Inside of the new window, you can then use the development version of `dbux-code`

## Analyze with Python Notebooks

In the `analyze/` folder, you find several python notebooks that allow you analyze the data that `dbux` generates. Here is how you set that up:

1. Run some program with Dbux enabled (e.g. `samples/[...]/oop1.js`)
1. In the VSCode extension, open a file of that program that has traces in it
1. In VSCode `Run Command` (`CTRL/Command + SHIFT + P`) -> `Dbux: Export file`
1. Make sure you have Python + Jupyter setup
   * Windows
      * [Install `Anaconda` with `chocolatey`](https://chocolatey.org/packages/anaconda3)
      * Set your `%PYTHONPATH%` in system config to your Anaconda `Lib` + `DLLs` folders (e.g. `C:\tools\Anaconda3\Lib;C:\tools\Anaconda3\DLLs;`)
      * Done!
   * Other OSes
1. Run one of the notebooks, load the file, and analyze



TODO: more to be said here in the future (consider https://gist.github.com/PurpleBooth/b24679402957c63ec426)