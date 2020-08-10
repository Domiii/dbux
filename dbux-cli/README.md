`@dbux/cli` is a command line interface for DBUX instrumentation.
`@dbux/cli` to DBUX is like [`nyc`](https://github.com/istanbuljs/nyc) to `istanbul` (albeit not as mature in development quite yet).

The cli injects `@dbux/runtime` upon `import` of any `js` file. As it executs, the runtime records all kinds of execution data, and automatically connects and sends the data to a server at a hardcoded port. Currently, the receiving server is hosted by the `dbux-code` VSCode extension. Without that extension, `@dbux/cli` (as of now) probably won't be of much use to you.

## Installation

* `npm i -D @dbux/cli`
* `yarn add --dev @dbux/cli`


## Usage
The commands share [these common command options](dbux-cli/src/util/commandCommons.js).

Currently it has two [commands](dbux-cli/src/commands):

### Run (r)
Run some JavaScript with DBUX enabled.

* `npx @dbux/cli r someFile.js`

You can enable babel to add all kinds `esnext` syntax proposals enabled with the `-next` flag.

Technical NOTE: It uses [`@babel/register`](https://babeljs.io/docs/en/babel-register) to essentially "instrument-on-import".


### Instrument (i)
This is more for internal development purposes. It allows you to look at the effective code after instrumentation.

E.g.: `npx @dbux/cli i someFile.js | code -`


## Package structure
In addition to the `src` and `dist` folders, it contains a `lib` folder which contains some scripts that are used in several command line utilitiies throughout the project structure (mostly in `webpack.config`s and `publish.js`) and do not require babel'ing.

## Dependency Linking (Aliasing)
In order to make things easier to use, `@dbux/cli` aliases all it's own dependencies in `linkOwnDependencies.js`.

There is (at least) one big caveat:

* `module-alias` [overwrites ` Module._resolveFilename`](https://github.com/ilearnio/module-alias/blob/dev/index.js#L29) and babel's plugin resolution ignores that (uses [a custom library](https://github.com/browserify/resolve/blob/master/lib/sync.js#L95) instead), meaning that babel plugins cannot be aliased, must either be installed or linked to a local `node_modules` folder in `cwd` or any of its parent directories