/* eslint no-console: 0 */

const path = require('path');
// const process = require('process');
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const {
  makeResolve,
  makeAbsolutePaths,
  getDbuxVersion
} = require('../dbux-cli/lib/package-util');


// const _oldLog = console.log; console.log = (...args) => _oldLog(new Error(' ').stack.split('\n')[2], ...args);
const projectRoot = path.resolve(__dirname);
const MonoRoot = path.resolve(__dirname, '..');

module.exports = (env, argv) => {
  const outputFolderName = 'dist';
  const outFile = 'bundle.js';

  const mode = argv.mode || 'development';
  const DBUX_VERSION = getDbuxVersion(mode);
  const DBUX_ROOT = mode === 'development' ? MonoRoot : null;

  console.debug(`[dbux-code] (DBUX_VERSION=${DBUX_VERSION}, mode=${mode}, DBUX_ROOT=${DBUX_ROOT}) building...`);

  const webpackPlugins = [
    new webpack.EnvironmentPlugin({
      NODE_ENV: mode,
      DBUX_VERSION,
      DBUX_ROOT
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.join(MonoRoot, 'dbux-projects', 'assets'),
          to: path.join(MonoRoot, 'dbux-code', 'resources', 'dist', 'projects')
        }
      ]
    })
    // new BundleAnalyzerPlugin()
  ];


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

  return {
    // https://github.com/webpack/webpack/issues/2145
    mode,
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
      vscode: "commonjs vscode",
      firebase: 'commonjs firebase'
    },
    node: {
      // generate actual output file information
      // see: https://webpack.js.org/configuration/node/#node__filename
      __dirname: false,
      __filename: false,
    }
  };
};

// console.warn('[dbux-code] webpack config loaded');