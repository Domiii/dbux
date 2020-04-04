const path = require('path');
const { makeResolve, makeAbsolutePaths } = require('../scripts/webpack.util');

// const _oldLog = console.log; console.log = (...args) => _oldLog(new Error(' ').stack.split('\n')[2], ...args);

const projectRoot = path.resolve(__dirname);
const MonoRoot = path.resolve(__dirname, '..');

// TODO: Do not build to remote path. Copy on deploy instead.
const outputFolder = path.join(MonoRoot, 'dbux-code', 'resources', 'dist');
const buildMode = 'development';
//const buildMode = 'production';

const dependencyPaths = ["dbux-common", "dbux-graph-common", "dbux-graph-client"];

const resolve = makeResolve(MonoRoot, dependencyPaths);
resolve.alias['@'] = path.join(projectRoot, 'src');

const absoluteDependencies = makeAbsolutePaths(MonoRoot, dependencyPaths);
const rules = [
  {
    loader: 'babel-loader',
    // test(resource) { /* see: https://stackoverflow.com/a/46769010 */ console.debug('[TEST]\n  ', resource); return true; },
    include: [
      ...absoluteDependencies.map(r => path.join(r, 'src')),
      // '../dbux-graph-common/src'
    ],
    options: {
      babelrc: true,
      babelrcRoots: [
        ...absoluteDependencies,
        // '../dbux-graph-common'
      ]
    }
  }
];
// console.log(rules[0].options.babelrcRoots);

const src = path.join(projectRoot, 'src');

const webpackPlugins = [
  // add post-build hook
  // see: https://stackoverflow.com/a/49786887apply: 
  (compiler) => {
    compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
      // copy result to dbux-code after build finished
      // WARNING: If we do not delay this, for some reason, this webpack config will affect other webpack configs in the root's multi build
      // setTimeout(() => {
      //   const from = path.join(outputFolder, outFile);
      //   const relativeTargetFolder = 'dbux-code/resources/graph';
      //   const to = path.join(root, relativeTargetFolder, 'graph.js');
      //   fs.copyFileSync(from, to);
      //   console.debug('Copied graph.js to ' + relativeTargetFolder);
      // }, 1000);
    });
  }
];

module.exports = {
  //watch: true,
  mode: buildMode,
  target: 'web',

  // https://github.com/webpack/webpack/issues/2145
  devtool: 'inline-module-source-map',
  // devtool: 'source-map',
  // devtool: 'inline-source-map',
  devServer: {
    contentBase: [
      path.join(projectRoot, 'public'),
      outputFolder,
      path.resolve(MonoRoot, 'analysis', '__data__')
    ],
    quiet: false,
    //host: '0.0.0.0',
    // host:
    hot: false,
    port: 3040,
    publicPath: '/',
    writeToDisk: true,  // need this for the VSCode<->Chrome debug extension to work
    filename: 'graph.js',
    historyApiFallback: {
      rewrites: [
        {
          from: /^\/data\/.*$/,
          to(context) {
            return `${context.parsedUrl.pathname.toLowerCase().substring(5)}`;
          }
        },
      ]
    }
  },
  plugins: webpackPlugins,
  context: path.join(projectRoot, '.'),
  entry: {
    graph: path.join(src, 'index.js')
  },
  output: {
    path: outputFolder,
    filename: '[name].js',
    publicPath: '/',
    // sourceMapFilename: outFile + ".map"
  },
  resolve,
  module: {
    rules
  }
};
