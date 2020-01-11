const path = require('path');
const process = require('process');
process.env.BABEL_DISABLE_CACHE = 1;

// const _oldLog = console.log; console.log = (...args) => _oldLog(new Error(' ').stack.split('\n')[2], ...args);

const outputFolderName = 'dist';

const outFile = 'bundle.js';


const webpackPlugins = [];

const projectRoot = __dirname;

module.exports = {
  // https://github.com/webpack/webpack/issues/2145
  mode: process.env.MODE || 'development',
  devtool: 'inline-module-source-map',
  // devtool: 'source-map',
  //devtool: 'inline-source-map',
  target: 'node',
  plugins: webpackPlugins,
  context: path.join(projectRoot, '.'),
  entry: projectRoot + '/src/index.js',
  output: {
    path: path.join(projectRoot, outputFolderName),
    filename: outFile,
    publicPath: outputFolderName,
    libraryTarget: "commonjs2",
    // sourceMapFilename: outFile + ".map"
  },
  resolve: {
    symlinks: true,
    extensions: ['.js' ],
    modules: [
      path.resolve(projectRoot + '/src'),
      path.resolve(projectRoot + '/node_modules'),

      // path.join(dbuxRoot, "dbux-common"),
      // path.join(dbuxRoot, "dbux-runtime")
    ]
  },
  module: {
    rules: [
      {
        loader: 'babel-loader',
        include: [
          path.join(projectRoot, 'src')
        ]
      },
      // {
      //   loader: 'babel-loader',
      //   include: [
      //     path.join(dbuxRoot, "dbux-common/src"),
      //     path.join(dbuxRoot, "dbux-runtime/src")
      //   ],
      //   options: {
      //     babelrcRoots: [
      //       path.join(dbuxRoot, "dbux-common"),
      //       path.join(dbuxRoot, "dbux-runtime")
      //     ]
      //   }
      // }
    ],
  },
  externals: {
    vscode: "commonjs vscode"
  }
};

console.warn('webpack config loaded');