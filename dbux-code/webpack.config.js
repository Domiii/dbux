/* eslint no-console: 0 */
const path = require('path');
// const process = require('process');
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const {
  makeResolve,
  makeAbsolutePaths
} = require('../dbux-cli/lib/package-util');
const webpackCommon = require('../config/webpack.config.common');

const { msgPackPlugin } = webpackCommon;

const { pathResolve } = require('../dbux-common-node/src/util/pathUtil');

// const _oldLog = console.log; console.log = (...args) => _oldLog(new Error(' ').stack.split('\n')[2], ...args);
const projectRoot = pathResolve(__dirname);
const MonoRoot = pathResolve(__dirname, '..');

module.exports = (env, argv) => {
  const mode = argv.mode || 'development';
  const {
    DBUX_VERSION,
    DBUX_ROOT
  } = webpackCommon('dbux-runtime', mode);


  // TODO: bring back optimization later
  const ForceNoOptimization = false;
  const outputFolderName = 'dist';
  const aggregateTimeout = mode === 'development' ? 200 : 3000;


  const webpackPlugins = [
    new webpack.EnvironmentPlugin({
      NODE_ENV: mode,
      DBUX_VERSION,
      DBUX_ROOT,
      RESEARCH_ENABLED: '' // NOTE: all env vars are converted to strings
      // RESEARCH_ENABLED: '1' // NOTE: all env vars are converted to strings
    }),
    new CopyPlugin({
      // NOTE: there is more copying in dbux-graph-client/webpack.config.js
      patterns: [
        {
          force: true,
          from: path.join(MonoRoot, 'dbux-projects', 'assets'),
          to: path.join(MonoRoot, 'dbux-code', 'resources', 'dist', 'projects')
        },

        // TODO: bring firebase back in, if we decide to use it
        // {
        //   force: true,
        //   from: path.join(MonoRoot, 'node_modules/firebase'),
        //   to: path.join(MonoRoot, 'dbux-code', 'resources', 'dist', 'node_modules', 'firebase')
        // }
      ]
    }),
    msgPackPlugin()
    // new BundleAnalyzerPlugin()
  ];


  const dependencyPaths = [
    "dbux-common",
    'dbux-common-node',
    "dbux-data",
    "dbux-graph-common",
    "dbux-graph-host",
    "dbux-projects",
    "dbux-code"
  ];

  const resourcesSrc = path.join(projectRoot, 'resources/src');


  const resolve = makeResolve(MonoRoot, dependencyPaths);
  resolve.modules.push(resourcesSrc);

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
    },
    // NOTE: we did the following for some outdated samples from BugJs that required very old Node versions.
    // {
    //   loader: 'babel-loader',
    //   include: resourcesSrc,
    //   options: {
    //     targets: {
    //        node: '4'
    //     }
    //     presets: [
    //       [
    //         '@babel/preset-env',
    //         {
    //           targets: {
    //             node: '4'
    //           },
    //           useBuiltIns: 'usage',
    //           corejs: 3
    //         }
    //       ]
    //     ],
    //   }
    // }
  ];

  // see https://webpack.js.org/guides/production/#minification
  // eslint-disable-next-line no-nested-ternary
  const optimization = mode !== 'production' ?
    undefined :
    ForceNoOptimization ?
      {
        minimize: false
      } :
      {
        minimize: true,
        minimizer: [
          new TerserPlugin({
            /**
             * Don't minimize resource files.
             */
            exclude: /resources[\\/]dist[\\/]/,
            terserOptions: {
              /**
               * We use class names for registering dbux-projects.
               */
              keep_classnames: true,
              /**
               * We use function names in `makeTreeItems` and some other places (e.g. `userCommands`).
               */
              keep_fnames: true
            }
          })
        ]
      };

  return {
    watchOptions: {
      poll: true,
      ignored: /node_modules/,
      aggregateTimeout
    },
    // https://github.com/webpack/webpack/issues/2145
    mode,
    // devtool: 'inline-module-source-map',
    devtool: 'source-map',
    //devtool: 'inline-source-map',
    target: 'node',
    plugins: webpackPlugins,
    context: path.join(projectRoot, '.'),
    entry: {
      bundle: path.join(projectRoot, 'src/index.js'),
      // _dbux_run: path.join(projectRoot, 'resources/src/_dbux_run.js')
    },
    output: {
      path: path.join(projectRoot, outputFolderName),
      filename: '[name].js',
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
      /**
       * @see https://github.com/cthackers/adm-zip/issues/242
       */
      'original-fs': 'original-fs',
      firebase: 'commonjs firebase',
      prettier: 'prettier'
    },
    node: {
      // generate actual output file information
      // see: https://webpack.js.org/configuration/node/#node__filename
      __dirname: false,
      __filename: false,
    },

    optimization
  };
};

// console.warn('[dbux-code] webpack config loaded');