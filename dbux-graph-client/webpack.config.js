/* eslint no-console: 0 */

const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

const webpackCommon = require('../config/webpack.config.common');

const {
  makeResolve,
  makeAbsolutePaths
} = require('../dbux-cli/lib/package-util');


// const _oldLog = console.log; console.log = (...args) => _oldLog(new Error(' ').stack.split('\n')[2], ...args);

const projectRoot = path.resolve(__dirname);
const MonoRoot = path.resolve(__dirname, '..');

// TODO: Do not build to remote path. Copy on deploy instead.
const webOutputFolder = path.join(MonoRoot, 'dbux-code/resources/dist/web');

const dependencies = [
  "dbux-common",
  "dbux-graph-common",
  "dbux-graph-client",
  "panzoom"
];


module.exports = (env, argv) => {
  const mode = argv.mode || 'development';

  const {
    DBUX_VERSION,
    DBUX_ROOT
  } = webpackCommon('dbux-graph-client', mode);

  const webpackPlugins = [
    new webpack.EnvironmentPlugin({
      NODE_ENV: mode,
      DBUX_VERSION,
      DBUX_ROOT
    }),
    new CopyPlugin({
      patterns: [
        /**
         * Theme files etc.
         */
        {
          force: true,
          from: path.join(projectRoot, 'assets'),
          to: webOutputFolder
        },
        /**
         * Bootstrap stuff
         */
        {
          force: true,
          from: path.join(MonoRoot, 'node_modules/bootstrap/dist/css/bootstrap.min.css'),
          to: path.join(webOutputFolder, 'light/bootstrap.min.css')
        },
        /**
         * graphviz.wasm file needs to be loaded from the client
         */
        {
          force: true,
          from: path.join(MonoRoot, '/node_modules/@hpcc-js/wasm/dist/graphvizlib.wasm'),
          to: path.join(webOutputFolder, 'graphvizlib.wasm')
        }
      ]
    })
    // add post-build hook
    // see: https://stackoverflow.com/a/49786887apply: 
    // (compiler) => {
    // compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
    // copy result to dbux-code after build finished
    // WARNING: If we do not delay this, for some reason, this webpack config will affect other webpack configs in the root's multi build
    // setTimeout(() => {
    //   const from = path.join(outputFolder, outFile);
    //   const relativeTargetFolder = 'dbux-code/resources/graph';
    //   const to = path.join(root, relativeTargetFolder, 'graph.js');
    //   fs.copyFileSync(from, to);
    //   console.debug('Copied graph.js to ' + relativeTargetFolder);
    // }, 1000);
    //   });
    // }
  ];

  const resolve = makeResolve(MonoRoot, dependencies);
  const src = path.join(projectRoot, 'src');

  const absoluteDependencies = makeAbsolutePaths(MonoRoot, dependencies);
  const rules = [
    // JavaScript
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
    },

    // CSS
    {
      test: /\.css$/i,
      include: [
        path.join(projectRoot, 'src'),
        path.join(projectRoot, 'node_modules'),
        path.join(MonoRoot, 'node_modules')
      ],
      use: [
        // Creates `style` nodes from JS strings
        'style-loader',
        // Translates CSS into CommonJS
        'css-loader'
      ]
    },

    // fonts (see https://chriscourses.com/blog/loading-fonts-webpack)
    {
      test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            // NOTE: this is relative to webpack's `publicPath`
            outputPath: 'fonts/'
          }
        }
      ]
    }
  ];
  // console.log(rules[0].options.babelrcRoots);

  return {
    watchOptions: {
      poll: true,
      ignored: /node_modules/
    },
    mode,
    target: 'web',

    // see https://stackoverflow.com/questions/54147824/can-the-vs-code-webview-developer-tools-deal-with-source-maps
    devtool: 'source-map',

    // https://github.com/webpack/webpack/issues/2145
    // devtool: 'inline-module-source-map',
    // devtool: 'source-map',
    // devtool: 'inline-source-map',
    // devServer: {
    //   contentBase: [
    //     path.join(projectRoot, 'public'),
    //     outputFolder,
    //     path.resolve(MonoRoot, 'analysis', '__data__')
    //   ],
    //   quiet: false,
    //   //host: '0.0.0.0',
    //   // host:
    //   hot: false,
    //   port: 3040,
    //   publicPath: '/',
    //   writeToDisk: true,  // need this for the VSCode<->Chrome debug extension to work
    //   filename: 'graph.js',
    //   historyApiFallback: {
    //     rewrites: [
    //       {
    //         from: /^\/data\/.*$/,
    //         to(context) {
    //           return `${context.parsedUrl.pathname.toLowerCase().substring(5)}`;
    //         }
    //       },
    //     ]
    //   }
    // },
    plugins: webpackPlugins,
    context: path.join(projectRoot, '.'),
    entry: {
      'graph.client': path.join(src, 'graph.client.js'),
      'pathways.client': path.join(src, 'pathways.client.js'),
      'pdg.client': path.join(src, 'pdg.client.js'),
    },
    output: {
      path: webOutputFolder,
      filename: '[name].js',
      publicPath: '/',
      // sourceMapFilename: outFile + ".map"
    },
    resolve,
    module: {
      rules
    }
  };
};
