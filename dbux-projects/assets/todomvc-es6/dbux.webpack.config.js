const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const buildWebpackConfig = require('./dbux.webpack.config.base');

const ProjectRoot = path.resolve(__dirname);

const resultCfg = buildWebpackConfig(ProjectRoot, {
  target: 'web'
}, {
  context: path.join(ProjectRoot, 'src'),
  entry: {
    app: './dbux_bootstrap.js',
    vendor: ['todomvc-app-css/index.css'],
  },

  devServer: {
    // contentBase: [
    //   projectRoot
    // ],
    quiet: false,
    //host: '0.0.0.0',
    // host:
    hot: true,
    port: 3033,
    // publicPath: outputFolder,
    writeToDisk: true,  // need this for the VSCode<->Chrome debug extension to work
    // filename: outFile,

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
      fs: 'fs',
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
  },
  externals: [
    {
      fs: '"fs"',
      tls: '"tls"'
    }
  ]
});

module.exports = resultCfg;