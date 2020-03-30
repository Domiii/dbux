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
const MonoRoot = path.resolve(__dirname, '..');

const dependencyPaths = ["dbux-common", "dbux-data", "dbux-code"];


function makeAbsolutePaths(root, relativePaths) {
  return relativePaths.map(f => path.resolve(path.join(root, f)));
}

/**
 * Resolve dependencies:
 * 1. node_modules/
 * 2. relativePaths: A list of paths relative to `root` that are also used in this project
 */
function makeResolve(root, relativePaths = []) {
  const absolutePaths = relativePaths.map(f => path.resolve(path.join(root, f)));
  absolutePaths.forEach(f => {
    if (!fs.existsSync(f)) {
      throw new Error('invalid dependency does not exist: ' + f);
    }
  });

  const moduleFolders = [
    path.join(root, '/node_modules'),
    ...[...absolutePaths]
      .map(f => [path.join(f, 'src'), path.join(f, 'node_modules')])
      .flat()
      .map(f => path.resolve(f))
  ];

  // adding these aliases allows resolving required libraries without them being in `node_modules`
  const alias = fromEntries(relativePaths.map(target => [
    path.basename(target), 
    path.resolve(path.join(root, target))
  ]));

  return {
    symlinks: true,
    alias,
    modules: [
      ...moduleFolders
    ]
  };
}


const resolve = makeResolve(MonoRoot, dependencyPaths);
const absolutePaths = makeAbsolutePaths(MonoRoot, dependencyPaths);
const rules = [
  // {
  //   loader: 'babel-loader',
  //   include: [
  //     path.join(projectRoot, 'src')
  //   ]
  // },
  {
    loader: 'babel-loader',
    include: absolutePaths.map(r => path.join(r, 'src')),
    options: {
      babelrcRoots: absolutePaths
    }
  }
];

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
  resolve,
  module: {
    rules,
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