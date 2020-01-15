const path = require('path');
const fs = require('fs');
const process = require('process');
process.env.BABEL_DISABLE_CACHE = 1;

// const _oldLog = console.log; console.log = (...args) => _oldLog(new Error(' ').stack.split('\n')[2], ...args);

const outputFolderName = 'dist';
const outFile = 'bundle.js';


const webpackPlugins = [];

const projectRoot = path.resolve(__dirname);

const dbuxRoot = path.resolve(__dirname + '/..');
const dbuxFolders = ["dbux-common", "dbux-data"];
const dbuxRoots = dbuxFolders.map(f => path.resolve(path.join(dbuxRoot,f)));

dbuxRoots.forEach(f => {
  if (!fs.existsSync(f)) {
    throw new Error('invalid dbuxFolder does not exist: ' + f);
  }
});


const allFolders = [projectRoot, ...dbuxRoots]
  .map(f => [path.join(f, 'src'), path.join(f, 'node_modules')])
  .flat()
  .map(f => path.resolve(f));

module.exports = {
  // https://github.com/webpack/webpack/issues/2145
  mode: process.env.MODE || 'development',
  // devtool: 'inline-module-source-map',
  devtool: 'source-map',
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
    devtoolModuleFilenameTemplate: "../[resource-path]",
    // sourceMapFilename: outFile + ".map"
  },
  resolve: {
    symlinks: true,
    extensions: ['.js' ],
    modules: [
      ...allFolders
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
      {
        loader: 'babel-loader',
        include: dbuxRoots.map(r => path.join(r, 'src')),
        options: {
          babelrcRoots: dbuxRoots
        }
      }
    ],
  },
  externals: {
    vscode: "commonjs vscode"
  }
};

console.warn('webpack config loaded');