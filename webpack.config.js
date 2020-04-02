// TODO: use parallel-webpack to run this together with dbux-code
// (see https://github.com/trivago/parallel-webpack)


const path = require('path');
const process = require('process');
const nodeExternals = require('webpack-node-externals');
const { makeResolve, makeAbsolutePaths } = require('./scripts/webpack.util');

const fromEntries = require('object.fromentries');    // NOTE: Object.fromEntries was only added in Node v12

process.env.BABEL_DISABLE_CACHE = 1;

const outputFolderName = 'dist';
const outFile = 'bundle.js';
const buildMode = 'development';
//const buildMode = 'production';

const MonoRoot = path.resolve(__dirname);

const dependencyPaths = [
  "dbux-common",
  "dbux-data",

  "dbux-babel-plugin",
  "dbux-runtime"
];

const targets = [
  // "dbux-cli"
  "dbux-babel-plugin",
  "dbux-runtime"
];

const resol = makeResolve(MonoRoot, dependencyPaths);
// fix for https://github.com/websockets/ws/issues/1538
resol.mainFields = ['main'];
// fix for https://github.com/websockets/ws/issues/1538
resol.alias.ws = path.resolve(path.join(MonoRoot, 'dbux-runtime', 'node_modules', 'ws', 'index.js'));
// alias['socket.io-client'] = path.resolve(path.join(root, 'dbux-runtime/node_modules', 'socket.io-client', 'socket.io.js' ));
// console.warn(resol);

const absoluteDependencies = makeAbsolutePaths(MonoRoot, dependencyPaths);


const webpackPlugins = [];

// const entry = fromEntries(targets.map(target => [target, path.join('..', target, 'src/index.js').substring(1)]));  // hackfix: path.join('.', dir) removes the leading period
const entry = fromEntries(targets.map(target => [target, path.resolve(path.join(target, 'src/index.js'))]));

// `context` is the path from which any relative paths are resolved
const context = MonoRoot;

// const context = path.join(root, target);
// const entry = {
//   bundle: './src/index.js'
// };
const output = {
  // path: path.join(context, outputFolderName),
  path: context,
  library: '[name]'     // see https://github.com/webpack/webpack/tree/master/examples/multi-part-library
  // library: target
};

// console.warn('webpack folders:\n  ', allFolders.join('\n  '));
// console.warn('webpack entries:', entry);

// NOTE: require things down here, not up above?
// const dbuxCode = require('./dbux-code/webpack.config');

// /*eslint global-require: 0 */
const otherWebpackConfigs = [
  require('./dbux-code/webpack.config'),

  // NOTE: Don't build `dbux-graph-web` here bc/ Webpack bugs out when merging configs with different targets (i.e. `node` + `browser`)
  // require('./dbux-graph-web/webpack.config')
];


module.exports = [
  {
    watch: true,  // NOTE: webpack 4 ignores `watch` attribute on any config but the first
    watchOptions: {
      poll: true,
      ignored: /node_modules/
    },
    mode: buildMode,

    // https://github.com/webpack/webpack/issues/2145
    // devtool: 'inline-module-source-map',
    devtool: 'source-map',
    // devtool: 'inline-source-map',
    plugins: webpackPlugins,
    context,
    entry,
    output: {
      ...output,
      libraryTarget: 'umd',
      libraryExport: 'default',
      publicPath: 'dbux',
      filename: '[name]/dist/index.js',
      sourceMapFilename: '[name]/dist/index.js.map',

      // see: https://gist.github.com/jarshwah/389f93f2282a165563990ed60f2b6d6c
      devtoolModuleFilenameTemplate: 'file:///[absolute-resource-path]',  // map to source with absolute file path not webpack:// protocol

      // hackfix for bug: https://medium.com/@JakeXiao/window-is-undefined-in-umd-library-output-for-webpack4-858af1b881df
      globalObject: 'typeof self !== "undefined" ? self : this',
    },
    resolve: resol,
    module: {
      rules: [
        {
          // test(resource) {
          //   // see: https://stackoverflow.com/a/46769010
          //   console.debug('[TEST]\n  ', resource);
          //   return true;
          // },
          loader: 'babel-loader',
          include: absoluteDependencies.map(r => path.join(r, 'src')),
          options: {
            babelrcRoots: absoluteDependencies
          }
        }
      ],
    },

    // see: https://webpack.js.org/guides/code-splitting/
    // optimization: {
    //   splitChunks: {
    //     chunks: 'all',
    //   },
    // },
    externals: [
      // see: https://www.npmjs.com/package/webpack-node-externals
      // NOTE: `node-externals` does not bundle `node_modules` but that also (for some reason) sometimes ignores linked packages in `yarn workspaces` monorepos :(
      nodeExternals({
        whitelist: [
          'perf_hooks',
          ...Object.keys(resol.alias).map(name => new RegExp(`^${name}/.*`))
        ],
        // (...args) {
        //   console.debug('nodeExternals', ...args);
        //   return true;
        // }
        // [
        //   'perf_hooks',

        //   // quote from the docs: "Important - if you have set aliases in your webpack config with the exact same names as modules in node_modules, you need to whitelist them so Webpack will know they should be bundled."
        //   ...Object.keys(resol.alias)
        // ]
      }),
      // 'fs', 'net'   // debug library complains about these
    ]
  },

  // NOTE: you can have multiple configs per file (see https://stackoverflow.com/a/46825869)
  ...otherWebpackConfigs
  // dbuxCode
];

// console.warn(Object.keys(resol.alias).map(name => new RegExp(`^${name}/.*`)));

// console.debug('[dbux] webpack.config loaded',
//   // targetsAbsolute
// );