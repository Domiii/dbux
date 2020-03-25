const path = require('path');
const fs = require('fs');
const process = require('process');
const fromEntries = require('object.fromentries');    // NOTE: Object.fromEntries was only added in Node v12

process.env.BABEL_DISABLE_CACHE = 1;

// const _oldLog = console.log; console.log = (...args) => _oldLog(new Error(' ').stack.split('\n')[2], ...args);

const outputFolderName = 'dist';
const outFile = 'bundle.js';


const webpackPlugins = [];

const projectRoot = path.resolve(__dirname);
const root = path.resolve(__dirname, '..');

const dbuxDepNames = ["dbux-common", "dbux-data", "dbux-code"];
const dbuxDepsAbsolute = dbuxDepNames.map(f => path.resolve(path.join(root, f)));

dbuxDepsAbsolute.forEach(f => {
  if (!fs.existsSync(f)) {
    throw new Error('invalid dbux dependency does not exist: ' + f);
  }
});



const allFolders = [
  path.join(root, '/node_modules'),
  ...[...dbuxDepsAbsolute]
    .map(f => [path.join(f, 'src'), path.join(f, 'node_modules')])
    .flat()
    .map(f => path.resolve(f))
];

// adding these aliases allows resolving required libraries without them being in `node_modules`
const alias = fromEntries(dbuxDepNames.map(target => [target, path.resolve(path.join(root, target))]));

module.exports = {
  // https://github.com/webpack/webpack/issues/2145
  mode: process.env.MODE || 'development',
  watch: true,
  // devtool: 'inline-module-source-map',
  devtool: 'source-map',
  //devtool: 'inline-source-map',
  target: 'node',
  plugins: webpackPlugins,
  context: path.join(projectRoot, '.'),
  entry: projectRoot + '/src/_includeIndex.js',
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
    alias,
    modules: [
      ...allFolders
    ]
  },
  module: {
    rules: [
      // {
      //   loader: 'babel-loader',
      //   include: [
      //     path.join(projectRoot, 'src')
      //   ]
      // },
      {
        loader: 'babel-loader',
        include: dbuxDepsAbsolute.map(r => path.join(r, 'src')),
        options: {
          babelrcRoots: dbuxDepsAbsolute
        }
      }
    ],
  },
  externals: {
    uws: "uws",
    vscode: "commonjs vscode"
  },
  node: {
    __dirname: false,
    __filename: false,
  }
};

// console.warn('[dbux-code] webpack config loaded');