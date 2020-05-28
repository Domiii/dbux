const path = require('path');
const webpack = require('webpack');
const buildWebpackConfig = require('./webpack.base.config.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const ProjectRoot = path.resolve(__dirname);


const resultCfg = buildWebpackConfig(ProjectRoot, {
  mode: 'development',
  context: path.resolve(path.join(ProjectRoot, 'src')),
  entry: {
    app: './bootstrap.js',
    vendor: ['todomvc-app-css/index.css'],
  },
  output: {
    filename: 'bundle.[name].js',
    path: path.resolve('dist')
  },

  devServer: {
    port: 3031,
    contentBase: [
      path.join(ProjectRoot, 'dist')
    ],
    // publicPath: outputFolder
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      inject: 'head',
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify("development")
      }
    })
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        include: [
          path.join(ProjectRoot, 'src'),
          path.join(ProjectRoot, 'node_modules')
        ],
        use: [
          // Creates `style` nodes from JS strings
          'style-loader',
          // Translates CSS into CommonJS
          'css-loader'
        ]
      },
    ]
  }
});

debugger;

module.exports = resultCfg;