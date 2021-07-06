const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const buildWebpackConfig = require('./dbux.webpack.config.base');

const ProjectRoot = path.resolve(__dirname);

const customCfg = {
  target: 'web',
  devServer: {
    publicPath: '/'
  }
};

const resultCfg = buildWebpackConfig(ProjectRoot, customCfg, (env, arg) => {
  return {
    context: path.join(ProjectRoot, 'src'),

    // TODO: if necessary, publicPath probably needs to be fixed, since `context` is not root
    output: {
      publicPath: '.'
    },

    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('development')
      }),
      new HtmlWebpackPlugin({
        template: './index.html',
        inject: 'head',
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
  };
});

module.exports = resultCfg;