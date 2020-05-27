const { resolve } = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin');

const buildWebpackConfig = require('./webpack.base.config.js');
const webpackConfigOrig = require('./webpack.config.babel.js');

const ProjectRoot = __dirname;

module.exports = buildWebpackConfig(ProjectRoot, webpackConfigOrig, {
  devServer: {
    port: 3030
  },
  // context: resolve('src'),
  // entry: {
  //   app: './bootstrap.js',
  //   vendor: ['todomvc-app-css/index.css'],
  // },
  // plugins: [
  //   new HtmlWebpackPlugin({
  //     template: './index.html',
  //     inject: 'head',
  //   })
  // ]
});