const path = require('path');
const process = require('process');
const mergeWith = require('lodash/mergeWith');
const { getDependencyRoot } = require('@dbux/cli/dist/dbuxFolders');
const nodeExternals = require('webpack-node-externals');
require('@dbux/babel-plugin');

process.env.BABEL_DISABLE_CACHE = 1;

// const _oldLog = console.log; console.log = (...args) => _oldLog(new Error(' ').stack.split('\n')[2], ...args);

const buildMode = 'development';
//const buildMode = 'production';

function mergeConcatArray(...inputs) {
  return mergeWith(...inputs,
    function customizer(dst, src) {
      if (Array.isArray(dst)) {
        return dst.concat(src);
      }
      return undefined;
    }
  );
}


// const dbuxFolders = ["dbux-runtime", "dbux-common", "dbux-data"];
// const dbuxFolders = ["dbux-runtime"];
// const dbuxRoots = dbuxFolders.map(f => path.resolve(path.join(MonoRoot, f)));


const babelOptions = {
  // sourceMaps: "both",
  sourceMaps: true,
  retainLines: true,
  babelrc: true,
  // presets: [
  //   [
  //     '@babel/preset-env',
  //     {
  //       targets: {
  //         node: '12',
  //         chrome: '70',
  //         safari: '13'
  //       },
  //       useBuiltIns: 'usage',
  //       corejs: 3
  //     }
  //   ]
  // ],
  plugins: [
    // [
    //   "@babel/plugin-proposal-class-properties",
    //   {
    //     loose: true
    //   }
    // ],
    // "@babel/plugin-proposal-optional-chaining",
    // [
    //   "@babel/plugin-proposal-decorators",
    //   {
    //     legacy: true
    //   }
    // ],
    // "@babel/plugin-proposal-function-bind",
    // "@babel/plugin-syntax-export-default-from",
    // "@babel/plugin-syntax-dynamic-import",
    // "@babel/plugin-transform-runtime",

    '@dbux/babel-plugin'
  ]
};


module.exports = (ProjectRoot, customConfig = {}, ...cfgOverrides) => {
  // const ExtraWatchWebpackPlugin = require('extra-watch-webpack-plugin');
  // webpackPlugins.push(
  //   new ExtraWatchWebpackPlugin({
  //     dirs: [
  //       path.join(dbuxPluginPath, 'dist')
  //     ]
  //   })
  // );

  const {
    src: srcFolders = ['src'],
    dbuxRoot,
    target = 'node'
  } = customConfig;


  let dbuxRules = [];
  if (dbuxRoot) {
    // // enable dbux debugging
    // const dbuxRuntimeFolder = path.join(dbuxRoot, 'dbux-runtime', 'dist');
    // dbuxRules.push({
    //   test: /\.js$/,
    //   // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    //   loader: require('source-map-loader'),
    //   include: [dbuxRuntimeFolder],
    //   enforce: 'pre'
    // });
  }

  const modules = [
    ...srcFolders.map(folder => path.join(ProjectRoot, folder)),
    path.join(ProjectRoot, 'node_modules')
  ];
  modules.push(path.join(getDependencyRoot(), 'node_modules'));

  const externals = target !== 'node' ? undefined : [
    {
      // 'dbux-runtime': 'umd @dbux/runtime',
      '@dbux/runtime': 'commonjs @dbux/runtime'
    },
    nodeExternals()
  ];

  const cfg = {
    //watch: true,
    mode: buildMode,

    target,

    // https://github.com/webpack/webpack/issues/2145
    // devtool: 'inline-module-source-map',
    devtool: 'source-map',
    //devtool: 'inline-source-map',
    plugins: [],
    context: path.join(ProjectRoot, '.'),
    output: {
      filename: '[name].js',
      path: path.resolve(ProjectRoot, 'dist'),
      publicPath: 'dist',
      libraryTarget: "commonjs",
      devtoolModuleFilenameTemplate: "../[resource-path]",
    },
    resolve: {
      symlinks: true,
      // extensions: ['.js', '.jsx'],
      modules
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          loader: 'babel-loader',
          include: [
            ...srcFolders.map(folder => path.join(ProjectRoot, folder))
          ],
          options: babelOptions,
          enforce: 'pre'
        },

        ...dbuxRules
      ],

      // // [webpack-2]
      // loaders: [
      //   {
      //     test: /\.jsx?$/,
      //     loaders: ['babel'],
      //     include: [
      //       path.join(projectRoot, srcFolder)
      //     ],
      //     options: babelOptions
      //   }
      // ],
    },

    node: {
      // generate actual output file information
      // see: https://webpack.js.org/configuration/node/#node__filename
      __dirname: true,
      __filename: true
    },

    externals

    // // [webpack-2]
    // babel: babelOptions
  };

  const resultCfg = mergeConcatArray(cfg, ...cfgOverrides);
  return resultCfg;
};

// console.warn('webpack config loaded');