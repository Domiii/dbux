const path = require('path');
const process = require('process');

process.env.BABEL_DISABLE_CACHE = 1;

// const _oldLog = console.log; console.log = (...args) => _oldLog(new Error(' ').stack.split('\n')[2], ...args);

const outputFolderName = 'dist';
const root = path.resolve(__dirname + '/../../..');
//const dbuxPlugin = require(path.join(root, 'node_modules/dbux-babel-plugin'));
const dbuxPluginPath = path.join(root, '/dbux-babel-plugin');
const dbuxPlugin = path.resolve(dbuxPluginPath);

require(dbuxPlugin);


// const dbuxFolders = ["dbux-runtime", "dbux-common", "dbux-data"];
const dbuxFolders = ["dbux-runtime"];
const dbuxRoots = dbuxFolders.map(f => path.resolve(path.join(root, f)));


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




module.exports = (projectRoot) => {
  // const ExtraWatchWebpackPlugin = require(projectRoot + '/node_modules/extra-watch-webpack-plugin');

  const webpackPlugins = [
    // new ExtraWatchWebpackPlugin({
    //   dirs: [
    //     path.join(dbuxPluginPath, 'dist')
    //   ]
    // })
  ];

  // const allFolders = [projectRoot, ...dbuxRoots]
  //   .map(f => [path.join(f, 'src'), path.join(f, 'node_modules')])
  //   .flat()
  //   .map(f => path.resolve(f));
    // console.log('webpack folders:', allFolders.join('\n'));
  return {
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
      // extensions: ['.js', '.jsx'],
      modules: [
        root,
        // dbuxRoots.map(f => path.join(f, 'dist')),
        path.join(projectRoot, 'src'),
        path.join(projectRoot, 'node_modules')
      ].flat()
    },
    module: {
      rules: [
        {
          loader: 'babel-loader',
          include: [
            path.join(projectRoot, 'src')
          ],
          options: babelOptions
        }
      ],
    },
  };
};

// console.warn('webpack config loaded');