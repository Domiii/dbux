/* eslint no-console: 0 */

const path = require('path');
const glob = require('glob');
// const process = require('process');
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const fromEntries = require('object.fromentries');    // NOTE: Object.fromEntries was only added in Node v12
const {
  makeResolve,
  makeAbsolutePaths,
  getDbuxVersion
} = require('./lib/package-util');


// const _oldLog = console.log; console.log = (...args) => _oldLog(new Error(' ').stack.split('\n')[2], ...args);
const projectRoot = path.resolve(__dirname);
// const projectRootNormalized = projectRoot.replace(/\\/g, '/');
const projectSrc = path.resolve(projectRoot, 'src');
const projectConfig = path.resolve(projectRoot, 'config');
const MonoRoot = path.resolve(__dirname, '..');

module.exports = (env, argv) => {
  const outputFolderName = 'dist';

  const mode = argv.mode || 'development';
  const DBUX_VERSION = getDbuxVersion(mode);
  const DBUX_ROOT = mode === 'development' ? MonoRoot : '';
  process.env.NODE_ENV = mode; // set these, so babel configs also have it
  process.env.DBUX_ROOT = DBUX_ROOT;

  console.debug(`[dbux-cli] (DBUX_VERSION=${DBUX_VERSION}, mode=${mode}, DBUX_ROOT=${DBUX_ROOT}) building...`);

  const webpackPlugins = [
    new webpack.EnvironmentPlugin({
      NODE_ENV: mode,
      DBUX_VERSION,
      DBUX_ROOT
    }),
    // new webpack.IgnorePlugin({
    //   checkResource(name, dir) {
    //     // console.error(name, dir);
    //     if (!name.startsWith(projectRootNormalized) && !name.startsWith('.')) {
    //       // ignore non-local files
    //       return true;
    //     }
    //     const fpath = path.resolve(dir, name);
    //     const regex = `^(${projectSrc}|${projectConfig})`.replace(/\\/g, '\\\\');
    //     const include = !!fpath.match(regex);
    //     // console.debug('[Webpack.ignore]', fpath, include);
    //     return !include;
    //   }
    // }),
    new webpack.ProvidePlugin({
      process: 'process'
    })
  ];


  const dependencyPaths = [
    "dbux-cli",
    "dbux-common",
    "dbux-runtime",
    "dbux-babel-plugin"
  ];


  const resolve = makeResolve(MonoRoot, dependencyPaths);
  const absoluteDependencies = makeAbsolutePaths(MonoRoot, dependencyPaths);

  // allow resolving `.babelrc` and `babel.config.js`
  resolve.modules.push(projectRoot);

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

  const inputFiles = 'src/{,commands/,util/}*.js';
  const entry = {
    // see https://stackoverflow.com/questions/34907999/best-way-to-have-all-files-in-a-directory-be-entry-points-in-webpack

    // generate all files in `src` and `src/commands`
    ...fromEntries(glob.sync(path.join(projectRoot, inputFiles)).map(fpath =>
      [fpath.substring(projectSrc.length + 1, fpath.length - 3), fpath]
    )),

    // TODO: dependOn

    // ...fromEntries(glob.sync(path.join(projectRoot, 'config/*.js')).map(fpath =>
    //   [fpath.substring(projectConfig.length + 1, fpath.length - 3), fpath]
    // )),
  };


  return {
    watchOptions: {
      poll: true,
      ignored: /node_modules/
    },
    // https://github.com/webpack/webpack/issues/2145
    mode,
    // devtool: 'inline-module-source-map',
    devtool: 'source-map',
    //devtool: 'inline-source-map',
    target: 'node',
    plugins: webpackPlugins,
    context: path.join(projectRoot, '.'),
    entry,
    output: {
      path: path.join(projectRoot, outputFolderName),
      filename: '[name].js',
      publicPath: outputFolderName,
      libraryTarget: "umd", // probably want commonjs instead
      devtoolModuleFilenameTemplate: "../[resource-path]",
      // sourceMapFilename: outFile + ".map"
    },

    resolve,
    module: {
      rules
    },

    // // NOTE: the following generates chunks correctly; however the chunks are not imported in the entries...
    // // "all is not supported on Node in Webpack 4"
    // // It is fixed in 5.0.0-alpha.13.
    // // see: https://github.com/webpack/webpack/issues/9133#issuecomment-493183040
    // optimization: {
    //   splitChunks: {
    //     // NOTE: we are currently not generating any common chunks, because
    //     // chunks: 'all',
    //     // name: false,
    //     cacheGroups: {
    //       common: {
    //         enforceSizeThreshold: 0,
    //         name: 'common-chunks',
    //         minChunks: 2,
    //         chunks: 'async',
    //         priority: 10,
    //         reuseExistingChunk: true,
    //         enforce: true
    //       }
    //     }
    //   }
    // },
    externals: [
      /^fs$/,
      /^process$/,
      /^path$/,
      nodeExternals({
        allowlist: [
          ...Object.keys(resolve.alias).map(name => new RegExp(`^${name}/src/.*`))
          // (...args) => {
          //   console.error(...args);
          //   return true;
          // }
        ]
      })
      // /node_modules\//,
      // /@babel\//,
      // /@dbux\//,
      // function (dir, name, callback) {
      //   // console.error(name, dir);
      //   if (!name.startsWith(projectRoot) && !name.startsWith('.')) {
      //     // ignore non-local files
      //     return callback(null, name);
      //   }
      //   const fpath = path.resolve(dir, name);
      //   const regex = `^(${projectSrc}|${projectConfig})`.replace(/\\/g, '\\\\');
      //   const include = !!fpath.match(regex);
      //   console.debug('[Webpack.include]', fpath, include);
      //   if (!include) {

      //   }
      //   callback();
      // }
    ],
    node: {
      // generate actual output file information
      // see: https://webpack.js.org/configuration/node/#node__filename
      __dirname: false,
      __filename: false,
    },
    stats: {
      // Ignore warnings due to yarg's dynamic module loading
      warningsFilter: [/node_modules\/yargs/]
    }
  };
};

// console.warn('[dbux-code] webpack config loaded');