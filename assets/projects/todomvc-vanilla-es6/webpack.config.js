const path = require('path');
const process = require('process');
process.env.BABEL_DISABLE_CACHE = 1;

// const _oldLog = console.log; console.log = (...args) => _oldLog(new Error(' ').stack.split('\n')[2], ...args);

const root = __dirname;
const outputFolderName = 'dist';
const dbuxRoot = path.resolve(root + '/../../../..');
//const dbuxPlugin = require(path.join(root, 'node_modules/dbux-babel-plugin'));
const dbuxPlugin = path.resolve(path.join(dbuxRoot, '/dbux-babel-plugin/src/babelInclude'));
// const dbuxPlugin = path.join(root, 'node_modules/dbux-babel-plugin');

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
    path.join(dbuxRoot, "dbux-common"),
    path.join(dbuxRoot, "dbux-runtime")
  ]
};

const outFile = 'bundle.js';
const buildMode = 'development';
//const buildMode = 'production';

const devServer = {
  contentBase: [
    root
  ],
  quiet: false,
  //host: '0.0.0.0',
  // host:
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
      path.join(dbuxRoot, "dbux-common"),
      path.join(dbuxRoot, "dbux-runtime")
    ]
  },
  module: {
    rules: [
      {
        loader: 'babel-loader',
        include: [
          path.join(root, 'src')
        ],
        options: babelOptions
      },
      {
        loader: 'babel-loader',
        include: [
          path.join(dbuxRoot, "dbux-common/src"),
          path.join(dbuxRoot, "dbux-runtime/src")
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
            path.join(dbuxRoot, "dbux-common"),
            path.join(dbuxRoot, "dbux-runtime")
          ]
        }
      }
    ],
  },
};

console.warn('webpack config loaded');