const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const buildWebpackConfig = require('./dbux.webpack.config.base');


const ProjectRoot = path.resolve(__dirname, 'examples', 'vanilla-es6');

const customCfg = {
  target: 'web',
  devServer: {
    publicPath: '/'
  }
};

const resultCfg = buildWebpackConfig(ProjectRoot, customCfg, (env, arg) => {
  return {
    output: {
      publicPath: '.'
    },
    // module: {
    //   rules: [
    //     {
    //       test: /\.css$/i,
    //       include: [
    //         path.join(ProjectRoot, 'src'),
    //         path.join(ProjectRoot, 'node_modules')
    //       ],
    //       use: [
    //         // Creates `style` nodes from JS strings
    //         'style-loader',
    //         // Translates CSS into CommonJS
    //         'css-loader'
    //       ]
    //     },
    //   ]
    // }
  };
});

module.exports = resultCfg;