const path = require('path');
const process = require('process');
const { makeResolve, makeAbsolutePaths } = require('../scripts/webpack.util');


// const _oldLog = console.log; console.log = (...args) => _oldLog(new Error(' ').stack.split('\n')[2], ...args);
const projectRoot = path.resolve(__dirname);
const MonoRoot = path.resolve(__dirname, '..');


const outputFolderName = 'dist';
const outFile = 'bundle.js';


const webpackPlugins = [];


const dependencyPaths = [
  "dbux-common",
  "dbux-data",
  "dbux-graph-common",
  "dbux-graph-host",
  "dbux-projects",
  "dbux-code"
];


const resolve = makeResolve(MonoRoot, dependencyPaths);
const absoluteDependencies = makeAbsolutePaths(MonoRoot, dependencyPaths);
// console.log(resolve.modules);
const rules = [
  // {
  //   loader: 'babel-loader',
  //   include: [
  //     path.join(projectRoot, 'src')
  //   ]
  // },
  {
    loader: 'babel-loader',
    include: absoluteDependencies.map(r => path.join(r, 'src')),
    options: {
      babelrcRoots: absoluteDependencies
    }
  }
];

module.exports = {
  // https://github.com/webpack/webpack/issues/2145
  mode: process.env.MODE || 'development',
  watch: true,
  // devtool: 'inline-module-source-map',
  devtool: 'source-map',
  //devtool: 'inline-source-map',
  target: 'node',
  plugins: webpackPlugins,
  context: path.join(projectRoot, '.'),
  entry: projectRoot + '/src/_includeIndex.js',
  output: {
    path: path.join(projectRoot, outputFolderName),
    filename: outFile,
    publicPath: outputFolderName,
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: "../[resource-path]",
    // sourceMapFilename: outFile + ".map"
  },
  resolve,
  module: {
    rules,
  },
  externals: {
    uws: "uws",
    vscode: "commonjs vscode"
  },
  node: {
    __dirname: false,
    __filename: false,
  }
};

// console.warn('[dbux-code] webpack config loaded');