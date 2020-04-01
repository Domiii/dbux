// TODO: use parallel-webpack to run this together with dbux-code
// (see https://github.com/trivago/parallel-webpack)


const path = require('path');
const process = require('process');
const nodeExternals = require('webpack-node-externals');

const fromEntries = require('object.fromentries');    // NOTE: Object.fromEntries was only added in Node v12

process.env.BABEL_DISABLE_CACHE = 1;

const outputFolderName = 'dist';
const root = path.resolve(__dirname);

const targets = [
  "dbux-common",
  "dbux-data",

  "dbux-babel-plugin",
  "dbux-runtime",
  // "dbux-cli"
];
const targetsAbsolute = targets.map(f => path.resolve(path.join(root, f)));

const outFile = 'bundle.js';
const buildMode = 'development';
//const buildMode = 'production';


const webpackPlugins = [];


const allFolders = [
  path.join(root, 'node_modules'),
  ...targetsAbsolute
    .map(f => [path.join(f, 'src'), path.join(f, 'node_modules')])
    .flat()
    .map(f => path.resolve(f))
];

// const entry = fromEntries(targets.map(target => [target, path.join('..', target, 'src/index.js').substring(1)]));  // hackfix: path.join('.', dir) removes the leading period
const entry = fromEntries(targets.map(target => [target, path.resolve(path.join(target, 'src/index.js'))]));
// const target = 'dbux-babel-plugin';

// aliases allow resolving libraries that we are building here
const alias = {
  ...fromEntries(targets.map(target => [target, path.resolve(path.join(root, target))])),
  // 'socket.io-client': path.resolve(path.join(root, 'dbux-runtime/node_modules', 'socket.io-client', 'socket.io.js' ))
  ws: path.resolve(path.join(root, 'dbux-runtime', 'node_modules', 'ws', 'index.js')) // fix for https://github.com/websockets/ws/issues/1538
};
// console.log(alias);

// `context` is the path from which any relative paths are resolved
const context = root;

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

  // NOTE: webpack bugs out when merging configs with different targets (i.e. `node` + `browser`)
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
      filename: '[name]/dist/index.js',
      libraryTarget: 'umd',
      libraryExport: 'default',
      publicPath: 'dbux',
      sourceMapFilename: '[name]/dist/index.js.map',

      // see: https://gist.github.com/jarshwah/389f93f2282a165563990ed60f2b6d6c
      devtoolModuleFilenameTemplate: 'file:///[absolute-resource-path]',  // map to source with absolute file path not webpack:// protocol

      // hackfix for bug: https://medium.com/@JakeXiao/window-is-undefined-in-umd-library-output-for-webpack4-858af1b881df
      globalObject: 'typeof self !== "undefined" ? self : this',
    },
    resolve: {
      symlinks: true,
      alias,

      mainFields: ['main'],  // fix for https://github.com/websockets/ws/issues/1538

      modules: [
        // see: https://github.com/webpack/webpack/issues/8824#issuecomment-475995296
        ...allFolders
      ]
    },
    module: {
      rules: [
        {
          loader: 'babel-loader',
          include: targetsAbsolute.map(r => path.join(r, 'src')),
          options: {
            babelrcRoots: targetsAbsolute
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
      nodeExternals({
        whitelist: ['perf_hooks']
      }),
      // 'fs', 'net'   // debug library complains about these
    ]
  },
  
  // NOTE: you can have multiple configs per file (see https://stackoverflow.com/a/46825869)
  ...otherWebpackConfigs
  // dbuxCode
];

console.debug('[dbux] webpack.config loaded',
  // targetsAbsolute
);