const path = require('path');
const process = require('process');
const fs = require('fs');

process.env.BABEL_DISABLE_CACHE = 1;

// const _oldLog = console.log; console.log = (...args) => _oldLog(new Error(' ').stack.split('\n')[2], ...args);

const root = path.resolve(path.join(__dirname, '/..'));
//const dbuxPlugin = require(path.join(root, 'node_modules/dbux-babel-plugin'));
// const dbuxPluginPath = path.join(root, '/dbux-babel-plugin');
// const dbuxPlugin = path.resolve(dbuxPluginPath);

// require(dbuxPlugin);


// const dbuxFolders = ["dbux-runtime", "dbux-common", "dbux-data"];
// const dbuxFolders = ["dbux-runtime"];
// const dbuxRoots = dbuxFolders.map(f => path.resolve(path.join(root, f)));


// const babelOptions = {
//   sourceMaps: "both",
//   retainLines: true,
//   babelrc: true,
//   plugins: [dbuxPlugin],
//   presets: [[
//     "@babel/preset-env",
//     {
//       "loose": true,
//       "useBuiltIns": "usage",
//       "corejs": 3
//     }
//   ]]
// };

const outputFolderName = 'dist';
const outFile = 'bundle.js';
const buildMode = 'development';
//const buildMode = 'production';


function buildConfig(projectRoot) {
  const src = path.join(projectRoot, 'src');
  const outputFolder = path.join(projectRoot, outputFolderName);

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

  // const allFolders = [projectRoot, ...dbuxRoots]
  //   .map(f => [path.join(f, 'src'), path.join(f, 'node_modules')])
  //   .flat()
  //   .map(f => path.resolve(f));
  // console.log('webpack folders:', allFolders.join('\n'));
  return {
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
        path.join(projectRoot, 'dist'),
        path.resolve(__dirname, '..', 'analysis', '__data__')
      ],
      quiet: false,
      //host: '0.0.0.0',
      // host:
      hot: true,
      port: 3040,
      publicPath: '/',
      writeToDisk: true,  // need this for the VSCode<->Chrome debug extension to work
      filename: outFile,
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
    entry: path.join(src, 'app.js'),
    output: {
      path: outputFolder,
      filename: outFile,
      publicPath: '/',
      // sourceMapFilename: outFile + ".map"
    },
    resolve: {
      symlinks: true,
      // extensions: ['.js', '.jsx'],
      modules: [
        root,
        // dbuxRoots.map(f => path.join(f, 'dist')),
        src,
        path.join(projectRoot, 'node_modules'),
        path.join(root, 'node_modules')
      ].flat()
    },
    module: {
      rules: [
        {
          loader: 'babel-loader',
          include: [
            src
          ],
          options: {
            babelrcRoots: [
              projectRoot
            ]
          }
        }
      ],
    },
  };
}


module.exports = buildConfig(__dirname);

// console.warn('dbux-graph webpack config loaded');