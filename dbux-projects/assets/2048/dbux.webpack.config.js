const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const buildWebpackConfig = require('./dbux.webpack.config.base');

const ProjectRoot = path.resolve(__dirname);

const customCfg = {
  target: 'web',
  devServer: true
};

const resultCfg = buildWebpackConfig(ProjectRoot, customCfg, (env, arg) => {
  if (!env.PORT) {
    throw new Error(`env has not provided PORT`);
  }

  return {
    context: path.join(ProjectRoot, 'src'),
    entry: {
      app: './bootstrap.js',
      vendor: ['todomvc-app-css/index.css'],
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
    },
    externals: [
      {
        // fs: 'console.error("required fs")',
        // tls: 'console.error("required tls")'
      }
    ]
  };
});

module.exports = resultCfg;