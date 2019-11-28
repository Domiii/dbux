const path = require('path');

const outputFolder = 'dist/';
const outFile = 'bundle.js';
const buildMode = 'development';
const configPath = path.resolve(__dirname, 'config/webpack');
// const buildMode = 'production';

const devServer = require('./config/webpack/webpack.dev-server')(outFile);
const plugins = require('./config/webpack/plugins.js')();


module.exports = {
  //watch: true,
  mode: buildMode,
  devtool: 'source-map',
  //devtool: 'inline-source-map',
  watchOptions: {
    aggregateTimeout: 5000,
    poll: 5000
  },
  devServer,
  plugins,
  context: path.join(__dirname, './'),
  entry: './src/index.js',
  output: {
    path: path.join(__dirname, outputFolder),
    filename: outFile,
    publicPath: outputFolder,
    // sourceMapFilename: outFile + ".map"
  },
  resolve: {
    extensions: ['.js', '.jsx']
    // alias: {
    //   src: path.resolve(__dirname, './src')
    // }
  },
  module: {
    rules: [
      {
        loader: "eslint-loader",
        enforce: "pre",
        test: /\.jsx?$/,
        exclude: [
          /node_modules/,
          /dbux\/samples/
        ],
        include: path.join(__dirname, 'src')
      },
      {
        loader: 'babel-loader',
        test: /\.jsx?$/,
        exclude: /node_modules/,
        include: path.join(__dirname, 'src')
      },
      {
        test: /\.css$/,
        include: [
          path.join(__dirname, 'src'),
          path.join(__dirname, 'node_modules')
        ],
        use: ['style-loader', 'css-loader']
      },

      // ignore source maps for some of the dbux internals
      // NOTE: last loader is applied first
      {
        test: /trackObject.js$/,
        loader: path.resolve(configPath, 'no-sourcemaps.js')
      }
    ],
  },
};