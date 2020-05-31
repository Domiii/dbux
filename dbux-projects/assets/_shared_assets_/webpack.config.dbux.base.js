const path = require('path');
const process = require('process');
const mergeWith = require('lodash/mergeWith');

process.env.BABEL_DISABLE_CACHE = 1;

// const _oldLog = console.log; console.log = (...args) => _oldLog(new Error(' ').stack.split('\n')[2], ...args);

const outputFolderName = 'dist';
const MonoRoot = path.resolve(path.join(__dirname, '/../..'));
//const dbuxPlugin = require(path.join(root, 'node_modules/dbux-babel-plugin'));
const dbuxPluginPath = path.join(MonoRoot, '/dbux-babel-plugin');

const dbuxPlugin = path.resolve(dbuxPluginPath);

require(dbuxPlugin);

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
  sourceMaps: "both",
  retainLines: true,
  babelrc: true,
  plugins: [dbuxPlugin],
  presets: [[
    "@babel/preset-env",
    {
      "loose": true,
      "useBuiltIns": "usage",
      "corejs": 3
    }
  ]]
};

const outFile = 'bundle.js';
const buildMode = 'development';
//const buildMode = 'production';


module.exports = (projectRoot, customConfig, ...cfgOverrides) => {
  // const ExtraWatchWebpackPlugin = require(projectRoot + '/node_modules/extra-watch-webpack-plugin');
  // webpackPlugins.push(
  //   new ExtraWatchWebpackPlugin({
  //     dirs: [
  //       path.join(dbuxPluginPath, 'dist')
  //     ]
  //   })
  // );

  // const allFolders = [projectRoot, ...dbuxRoots]
  //   .map(f => [path.join(f, srcFolder), path.join(f, 'node_modules')])
  //   .flat()
  //   .map(f => path.resolve(f));
  // console.log('webpack folders:', allFolders.join('\n'));
  const srcFolder = customConfig && customConfig.src || 'src';
  const cfg = {
    //watch: true,
    mode: buildMode,

    // https://github.com/webpack/webpack/issues/2145
    devtool: 'inline-module-source-map',
    // devtool: 'source-map',
    //devtool: 'inline-source-map',
    devServer: {
      // contentBase: [
      //   projectRoot
      // ],
      quiet: false,
      //host: '0.0.0.0',
      // host:
      hot: true,
      port: 3030,
      // publicPath: outputFolder,
      writeToDisk: true,  // need this for the VSCode<->Chrome debug extension to work
      // filename: outFile,
    },
    plugins: [],
    context: path.join(projectRoot, '.'),
    output: {
      path: path.join(projectRoot, outputFolderName),
      filename: outFile,
      publicPath: outputFolderName,
      // sourceMapFilename: outFile + ".map"
    },
    resolve: {
      symlinks: true,
      // extensions: ['.js', '.jsx'],
      modules: [
        MonoRoot,
        // dbuxRoots.map(f => path.join(f, 'dist')),
        path.join(projectRoot, srcFolder),
        path.join(projectRoot, 'node_modules'),
        path.join(MonoRoot, 'node_modules')
      ].flat()
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          loader: 'babel-loader',
          include: [
            path.join(projectRoot, srcFolder)
          ],
          options: babelOptions
        }
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
    
    // // [webpack-2]
    // babel: babelOptions
  };

  const resultCfg = mergeConcatArray(cfg, ...cfgOverrides);
  return resultCfg;
};

// console.warn('webpack config loaded');