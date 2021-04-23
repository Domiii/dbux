/* eslint-disable no-console */
/* eslint-disable global-require */

const path = require('path');
const process = require('process');
const webpack = require('webpack');
const mergeWith = require('lodash/mergeWith');
const { getDependencyRoot } = require('@dbux/cli/lib/dbux-folders');
const { deserializeWebpackInput, parseEnv } = require('@dbux/cli/lib/webpack-basics');
const isFunction = require('lodash/isFunction');
const isArray = require('lodash/isArray');
const isObject = require('lodash/isObject');
const CopyPlugin = require('copy-webpack-plugin');
require('@dbux/babel-plugin');

// eslint-disable-next-line import/no-dynamic-require
const nodeExternals = require(path.join(getDependencyRoot(), 'node_modules/webpack-node-externals'));

process.env.BABEL_DISABLE_CACHE = 1;

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

// TODO: pass actual node version in via parameter (part of `target`)
// const presets = 

const defaultBabelOptions = {
  // sourceMaps: "both",
  // see https://github.com/webpack/webpack/issues/11510#issuecomment-696027212
  sourceType: "unambiguous",
  sourceMaps: true,
  retainLines: true,
  babelrc: true,
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'usage',
        corejs: 3
      }
    ]
  ],
  plugins: [
    // [
    //   "@babel/plugin-proposal-class-properties",
    //   {
    //     loose: true
    //   }
    // ],
    // "@babel/plugin-proposal-optional-chaining",
    //   "@babel/plugin-proposal-decorators",
    // [
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
  return (env, argv) => {
    env = parseEnv(env);
    // const ExtraWatchWebpackPlugin = require('extra-watch-webpack-plugin');
    // webpackPlugins.push(
    //   new ExtraWatchWebpackPlugin({
    //     dirs: [
    //       path.join(dbuxPluginPath, 'dist')
    //     ]
    //   })
    // );

    // ###########################################################################
    // parse env
    // ###########################################################################

    // console.warn('  env:', JSON.stringify(env, null, 2));

    // ###########################################################################
    // customConfig
    // ###########################################################################

    if (isFunction(customConfig)) {
      customConfig = customConfig(env, argv);
    }

    let {
      src: srcFolders = ['src'],
      dbuxRoot,
      entry,
      plugins,
      target = 'node',
      babelOptions: babelOptionsOverrides,
      devServer: devServerCfg
    } = customConfig;

    // ###########################################################################
    // devServer
    // ###########################################################################

    let devServer;
    if (devServerCfg) {
      const devServerFn = require('./dbux.webpack-dev-server.config.base.js');
      devServer = devServerFn(ProjectRoot, env, argv);
      let devServerOverrides;
      if (isObject(devServerCfg)) {
        devServerOverrides = devServerCfg;
      }
      else if (isFunction(devServerCfg)) {
        devServerOverrides = devServerCfg(env, argv);
      }
      else if (devServerCfg !== true) {
        throw new Error(`Invalid devServer config (must be true, object or function) - ${JSON.stringify(devServerCfg)}`);
      }
      Object.assign(devServer, devServerOverrides);
    }


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

    // ###########################################################################
    // entry
    // ###########################################################################

    entry = entry || env?.entry || { main: 'src/index.js' };

    entry = Object.fromEntries(
      Object.entries(entry)
        .map(([key, value]) => [
          key, 
          value
          // Array.isArray(value) ? value : path.resolve(ProjectRoot, value)
        ])
    );

    // ###########################################################################
    // plugins
    // ###########################################################################

    plugins = plugins || [];
    plugins.push(
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify("development")
        }
      })
    );

    // console.warn('  env.entry:', JSON.stringify(entry, null, 2));

    // ###########################################################################
    // resolve.modules
    // ###########################################################################

    const modules = [
      ...srcFolders.map(folder => path.join(ProjectRoot, folder)),
      path.join(ProjectRoot, 'node_modules')
    ];
    modules.push(
      path.join(getDependencyRoot(), 'node_modules')
    );

    // ###########################################################################
    // resolve.alias
    // ###########################################################################

    const alias = {
    };

    // ###########################################################################
    // externals
    // ###########################################################################

    const babelOptions = { ...defaultBabelOptions };
    if (babelOptionsOverrides) {
      // babel overrides
      Object.assign(babelOptions, babelOptionsOverrides);
    }
    if (!(babelOptionsOverrides && babelOptionsOverrides.presets) && target !== 'node') {
      // remove custom options of preset-env
      babelOptions.presets[0].splice(1, 1);
    }
    // console.warn('babelOptions', JSON.stringify(babelOptions, null, 2));

    const externals = target !== 'node' ? undefined : [
      {
        // 'dbux-runtime': 'umd @dbux/runtime',
        '@dbux/runtime': 'commonjs @dbux/runtime'
      },
      nodeExternals({
        additionalModuleDirs: [path.join(getDependencyRoot(), 'node_modules')]
      }),

      // (context, request, callback) => {
      //   console.warn('external', context, request);
      //   callback();
      // }
    ];

    // ###########################################################################
    // optimization
    // ###########################################################################

    // see https://v4.webpack.js.org/guides/code-splitting/
    // Problem: you somehow have to manually embed all chunks, before webpack starts bootstrapping...
    // const optimization = {
    //   splitChunks: {
    //     chunks: 'all',
    //   },
    // };
    const optimization = undefined;

    // ###########################################################################
    // put it all together
    // ###########################################################################

    const cfg = {
      watch: true,
      mode: buildMode,
      entry,
      target,
      devServer,
      // https://github.com/webpack/webpack/issues/2145
      // devtool: 'inline-module-source-map',
      devtool: 'source-map',
      plugins,
      context: path.join(ProjectRoot, '.'),
      output: {
        filename: '[name].js',
        path: path.resolve(ProjectRoot, 'dist'),
        publicPath: 'dist',
        libraryTarget: target === 'node' ? 'commonjs2' : 'var',
        devtoolModuleFilenameTemplate: "../[resource-path]",
      },
      resolve: {
        // symlinks: true,
        alias,
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

      externals,

      optimization
    };


    // ###########################################################################
    // merge in overrides
    // ###########################################################################

    cfgOverrides = cfgOverrides.map(cb => isFunction(cb) ? cb(env, argv) : cb);

    const resultCfg = mergeConcatArray(cfg, ...cfgOverrides);

    // console.debug('WEBPACK.CONFIG', JSON.stringify(resultCfg, null, 2));

    return resultCfg;
  };
};

// console.warn('webpack config loaded');


// ###########################################################################
// copyPlugin
// ###########################################################################

module.exports.copyPlugin = function copyPlugin(ProjectRoot, files) {
  return new CopyPlugin({
    patterns: files.map(f => ({
      force: true,
      from: path.join(ProjectRoot, f),
      to: path.join(ProjectRoot, 'dist', f)
    }))
  });
};