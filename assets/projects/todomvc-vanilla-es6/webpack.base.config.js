const path = require('path');
const process = require('process');
process.env.BABEL_DISABLE_CACHE = 1;

// const _oldLog = console.log; console.log = (...args) => _oldLog(new Error(' ').stack.split('\n')[2], ...args);

const outputFolderName = 'dist';
const dbuxRoot = path.resolve(__dirname + '/../../..');
//const dbuxPlugin = require(path.join(root, 'node_modules/dbux-babel-plugin'));
const dbuxPlugin = path.resolve(path.join(dbuxRoot, '/dbux-babel-plugin/src/babelInclude'));

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
  ]]
};

const outFile = 'bundle.js';
const buildMode = 'development';
//const buildMode = 'production';


const webpackPlugins = [];



module.exports = (projectRoot) => ({
  //watch: true,
  mode: buildMode,

  // https://github.com/webpack/webpack/issues/2145
  devtool: 'inline-module-source-map',
  // devtool: 'source-map',
  //devtool: 'inline-source-map',
  devServer: {
    contentBase: [
      projectRoot
    ],
    quiet: false,
    //host: '0.0.0.0',
    // host:
    hot: true,
    port: 3030,
    // publicPath: outputFolder,
    writeToDisk: true,  // need this for the VSCode<->Chrome debug extension to work
    filename: outFile,
  },
  plugins: webpackPlugins,
  context: path.join(projectRoot, '.'),
  entry: projectRoot + '/src/app.js',
  output: {
    path: path.join(projectRoot, outputFolderName),
    filename: outFile,
    publicPath: outputFolderName,
    // sourceMapFilename: outFile + ".map"
  },
  resolve: {
    symlinks: true,
    extensions: ['.js', '.jsx'],
    modules: [
      path.resolve(projectRoot + '/src'),
      path.resolve(projectRoot + '/node_modules'),

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
          path.join(projectRoot, 'src')
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
          babelrcRoots: [
            path.join(dbuxRoot, "dbux-common"),
            path.join(dbuxRoot, "dbux-runtime")
          ]
        }
      }
    ],
  },
});

console.warn('webpack config loaded');