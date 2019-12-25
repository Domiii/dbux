const path = require('path');
const process = require('process');
process.env.BABEL_DISABLE_CACHE = 1;

// const _oldLog = console.log; console.log = (...args) => _oldLog(new Error(' ').stack.split('\n')[2], ...args);

const root = __dirname;
const outputFolderName = 'dist';
const dbuxRoot = path.resolve(__dirname + '/../../../..');
//const dbuxPlugin = require(path.join(root, 'node_modules/dbux-babel-plugin'));
const dbuxPlugin = dbuxRoot + '/dbux-babel-plugin';
// const dbuxPlugin = path.join(root, 'node_modules/dbux-babel-plugin');


// TODO: as usual, webpack sourcemaps are not working
// TODO: only babel, no webpack, produce result files


const babelRegisterOptions = {
  ignore: [
    // '**/node_modules/**',
    function (fpath) {
      // console.log('[babel-register]', fpath);
      // return false;

      // no node_modules
      if (fpath.match(/node_modules/)) {
        return true;
      }

      const isIgnored = !fpath.match(/[/]dbux-/);

      // only dbux plugin + common
      // console.warn(fpath, !isIgnored);
      return isIgnored;
    }
  ],
  sourceMaps: "both",
  retainLines: true,
  plugins: [
    '@babel/plugin-transform-runtime'
  ],
  presets: [[
    "@babel/preset-env",
    {
      "loose": true,
      "useBuiltIns": "usage",
      "corejs": 3
    }
  ]],
  babelrcRoots: [
    __dirname,
    dbuxRoot + "/dbux-babel-plugin",
    dbuxRoot + "/dbux-common",
    dbuxRoot + "/dbux-runtime"
  ]
};
const babelRegister = require('@babel/register');
babelRegister(babelRegisterOptions);

require(dbuxPlugin);


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
  ]],
  babelrcRoots: [
    __dirname,
    dbuxRoot + "/dbux-common",
    dbuxRoot + "/dbux-runtime"
  ]
};

const outFile = 'bundle.js';
const buildMode = 'development';
//const buildMode = 'production';

const devServer = {
  contentBase: [
    root
  ],
  host: '0.0.0.0',
  hot: true,
  port: 3000,
  // publicPath: outputFolder,
  writeToDisk: true,  // need this for the VSCode<->Chrome debug extension to work
  filename: outFile,
};

const webpackPlugins = [];



module.exports = {
  //watch: true,
  mode: buildMode,

  // https://github.com/webpack/webpack/issues/2145
  devtool: 'inline-module-source-map',
  // devtool: 'source-map',
  //devtool: 'inline-source-map',
  devServer,
  plugins: webpackPlugins,
  context: path.join(__dirname, '.'),
  entry: root + '/src/app.js',
  output: {
    path: path.join(__dirname, outputFolderName),
    filename: outFile,
    publicPath: outputFolderName,
    // sourceMapFilename: outFile + ".map"
  },
  resolve: {
    symlinks: true,
    extensions: ['.js', '.jsx'],
    modules: [
      path.resolve(root + '/src'),
      path.resolve(root + '/node_modules'),

      // see: https://github.com/webpack/webpack/issues/8824#issuecomment-475995296
      dbuxRoot + "/dbux-common",
      dbuxRoot + "/dbux-runtime"
    ]
  },
  module: {
    rules: [
      {
        loader: 'babel-loader',
        include: [
          root + '/src/'
        ],
        options: babelOptions
      },
      {
        loader: 'babel-loader',
        include: [
          dbuxRoot + "/dbux-common/src",
          dbuxRoot + "/dbux-runtime/src"
        ],
        options: {
          sourceMaps: "both",
          retainLines: true,
          babelrc: true,
          plugins: [],
          presets: [[
            "@babel/preset-env",
            {
              "loose": true,
              "useBuiltIns": "usage",
              "corejs": 3
            }
          ]],
          babelrcRoots: [
            dbuxRoot + "/dbux-common",
            dbuxRoot + "/dbux-runtime"
          ]
        }
      }
    ],
  },
};

console.warn('webpack config loaded');